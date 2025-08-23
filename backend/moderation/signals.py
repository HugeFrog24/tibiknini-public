import logging

from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

from core.models import SiteInfo
from core.tasks import send_scheduled_email

from .models import ContentReport, UserWarning

logger = logging.getLogger(__name__)


@receiver(post_save, sender=ContentReport)
def send_moderation_notification(sender, instance, created, **kwargs):
    """
    Signal to send notification when a report is reviewed and action is taken.
    """
    # Only send notification if the report was reviewed (not when created)
    if not created and instance.reviewed_at and instance.verdict.startswith('upheld'):
        try:
            # Get the content object to find the affected user
            content_obj = instance.content_type.get_object_for_this_type(id=instance.object_id)
            
            # Determine the affected user
            affected_user = None
            if hasattr(content_obj, 'author'):
                affected_user = content_obj.author
            elif hasattr(content_obj, 'user'):
                affected_user = content_obj.user
            
            if not affected_user or not affected_user.email:
                return
            
            # Get site information for email context
            site_info = SiteInfo.objects.first()
            site_title = site_info.site_title if site_info else "Our Platform"
            
            # Determine action taken and email template
            action_map = {
                'upheld_hidden': {
                    'action': 'hidden',
                    'description': 'Your content has been hidden from public view'
                },
                'upheld_warning': {
                    'action': 'warning issued',
                    'description': 'A warning has been issued to your account'
                },
                'upheld_banned': {
                    'action': 'account suspended',
                    'description': 'Your account has been suspended'
                }
            }
            
            action_info = action_map.get(instance.verdict, {
                'action': 'moderated',
                'description': 'Action has been taken on your content'
            })
            
            # Determine content type for user-friendly display
            content_type_display = {
                'comment': 'comment',
                'blogpost': 'blog post',
                'customuser': 'profile'
            }.get(instance.content_type.model.lower(), 'content')
            
            context = {
                'username': affected_user.username,
                'site_title': site_title,
                'content_type': content_type_display,
                'content_description': str(content_obj)[:100] + ('...' if len(str(content_obj)) > 100 else ''),
                'reason': instance.reason.name,
                'action_taken': action_info['action'],
                'action_description': action_info['description'],
                'verdict_note': instance.verdict_note or '',
                'review_date': instance.reviewed_at.strftime("%B %d, %Y at %I:%M %p %Z"),
                'reviewer': instance.reviewed_by.username if instance.reviewed_by else 'Moderation Team',
            }
            
            # Schedule the moderation notification email
            send_scheduled_email.delay(
                subject=f"Content Moderation Action - {site_title}",
                recipient_list=[affected_user.email],
                template_name="emails/moderation_notification.txt",
                context=context,
            )
            
            logger.info(f"Scheduled moderation notification email for user {affected_user.username}")
            
        except Exception as e:
            logger.error(
                f"Failed to schedule moderation notification email for report {instance.id}: {str(e)}"
            )


@receiver(post_save, sender=UserWarning)
def send_warning_notification(sender, instance, created, **kwargs):
    """
    Signal to send notification when a user receives a warning.
    """
    if created:
        try:
            # Get site information for email context
            site_info = SiteInfo.objects.first()
            site_title = site_info.site_title if site_info else "Our Platform"
            
            context = {
                'username': instance.user.username,
                'site_title': site_title,
                'reason': instance.reason,
                'issued_by': instance.issued_by.username if instance.issued_by else 'Moderation Team',
                'issued_date': instance.issued_at.strftime("%B %d, %Y at %I:%M %p %Z"),
                'report_id': instance.report.id if instance.report else 'N/A',
            }
            
            # Schedule the warning notification email
            send_scheduled_email.delay(
                subject=f"Warning Issued - {site_title}",
                recipient_list=[instance.user.email],
                template_name="emails/warning_notification.txt",
                context=context,
            )
            
            logger.info(f"Scheduled warning notification email for user {instance.user.username}")
            
        except Exception as e:
            logger.error(
                f"Failed to schedule warning notification email for user {instance.user.username}: {str(e)}"
            )