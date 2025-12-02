import logging
from celery import shared_task
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import transaction

from .models import ContentReport

logger = logging.getLogger(__name__)
User = get_user_model()


@shared_task(bind=True, max_retries=3)
def process_moderation_review(self, report_id, reviewer_id, verdict, note=""):
    """
    Process a moderation review asynchronously with retry logic.
    
    Args:
        report_id: ID of the ContentReport to review
        reviewer_id: ID of the User performing the review
        verdict: The verdict to apply ('upheld_hidden', 'upheld_warning', etc.)
        note: Optional note from the reviewer
    
    Returns:
        dict: Result of the moderation action
    """
    try:
        with transaction.atomic():
            # Get the report and reviewer
            try:
                report = ContentReport.objects.select_for_update().get(id=report_id)
                reviewer = User.objects.get(id=reviewer_id)
            except ContentReport.DoesNotExist:
                logger.error(f"ContentReport {report_id} not found")
                return {"success": False, "error": "Report not found"}
            except User.DoesNotExist:
                logger.error(f"User {reviewer_id} not found")
                return {"success": False, "error": "Reviewer not found"}
            
            # Check if report is already reviewed
            if report.verdict != 'pending':
                logger.warning(f"Report {report_id} already reviewed with verdict: {report.verdict}")
                return {"success": False, "error": "Report already reviewed"}
            
            # Take moderation action if needed (for upheld verdicts)
            if verdict.startswith("upheld") and not report.action_taken:
                action_map = {
                    "upheld_hidden": "hide",
                    "upheld_warning": "warning", 
                    "upheld_banned": "ban"
                }
                
                action_type = action_map.get(verdict)
                if action_type:
                    try:
                        report.take_action(reviewer, action_type)
                        logger.info(f"Successfully took action '{action_type}' for report {report_id}")
                    except ValidationError as e:
                        logger.error(f"Failed to take action for report {report_id}: {str(e)}")
                        return {"success": False, "error": f"Failed to take moderation action: {str(e)}"}
            
            # Review the report
            try:
                report.review(reviewer=reviewer, verdict=verdict, note=note)
                logger.info(f"Successfully reviewed report {report_id} with verdict '{verdict}'")
                
                return {
                    "success": True,
                    "report_id": report_id,
                    "verdict": verdict,
                    "action_taken": report.action_taken,
                    "reviewed_at": report.reviewed_at.isoformat() if report.reviewed_at else None
                }
                
            except ValidationError as e:
                logger.error(f"Failed to review report {report_id}: {str(e)}")
                return {"success": False, "error": f"Failed to review report: {str(e)}"}
                
    except Exception as exc:
        logger.error(f"Unexpected error processing moderation review for report {report_id}: {str(exc)}", exc_info=True)
        
        # Retry with exponential backoff for transient errors
        if self.request.retries < self.max_retries:
            countdown = 60 * (2 ** self.request.retries)  # 60s, 120s, 240s
            logger.info(f"Retrying moderation review for report {report_id} in {countdown} seconds (attempt {self.request.retries + 1})")
            raise self.retry(exc=exc, countdown=countdown)
        else:
            logger.error(f"Max retries exceeded for moderation review of report {report_id}")
            return {"success": False, "error": f"Max retries exceeded: {str(exc)}"}


@shared_task
def cleanup_old_moderation_actions(days_old=90):
    """
    Periodic task to clean up old moderation actions and optimize database.
    
    Args:
        days_old: Number of days after which to consider actions as old
    """
    from django.utils import timezone
    from datetime import timedelta
    from .models import ModerationAction
    
    try:
        cutoff_date = timezone.now() - timedelta(days=days_old)
        
        # Count actions to be cleaned up
        old_actions = ModerationAction.objects.filter(performed_at__lt=cutoff_date)
        count = old_actions.count()
        
        if count > 0:
            # Delete old actions (keep recent ones for audit purposes)
            deleted_count = old_actions.delete()[0]
            logger.info(f"Cleaned up {deleted_count} old moderation actions older than {days_old} days")
            return {"success": True, "cleaned_up": deleted_count}
        else:
            logger.info(f"No moderation actions older than {days_old} days found")
            return {"success": True, "cleaned_up": 0}
            
    except Exception as e:
        logger.error(f"Failed to cleanup old moderation actions: {str(e)}", exc_info=True)
        return {"success": False, "error": str(e)}


@shared_task
def generate_moderation_report():
    """
    Generate periodic moderation statistics report.
    """
    from django.utils import timezone
    from datetime import timedelta
    from .models import ContentReport, UserWarning
    
    try:
        # Get stats for the last 30 days
        thirty_days_ago = timezone.now() - timedelta(days=30)
        
        stats = {
            "period": "last_30_days",
            "reports": {
                "total": ContentReport.objects.filter(reported_at__gte=thirty_days_ago).count(),
                "pending": ContentReport.objects.filter(reported_at__gte=thirty_days_ago, verdict='pending').count(),
                "upheld": ContentReport.objects.filter(reported_at__gte=thirty_days_ago, verdict__startswith='upheld').count(),
                "rejected": ContentReport.objects.filter(reported_at__gte=thirty_days_ago, verdict='rejected').count(),
            },
            "warnings": {
                "total": UserWarning.objects.filter(issued_at__gte=thirty_days_ago).count(),
            },
            "generated_at": timezone.now().isoformat()
        }
        
        logger.info(f"Generated moderation report: {stats}")
        return stats
        
    except Exception as e:
        logger.error(f"Failed to generate moderation report: {str(e)}", exc_info=True)
        return {"success": False, "error": str(e)}