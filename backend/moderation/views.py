from django.contrib.contenttypes.models import ContentType
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import ContentReport, ReportReason
from .serializers import ContentReportSerializer, ReportReasonSerializer
import logging

logger = logging.getLogger(__name__)

# Create your views here.


class ReportReasonViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for listing active report reasons.
    Only authenticated users can view reasons.
    """

    queryset = ReportReason.objects.filter(is_active=True)
    serializer_class = ReportReasonSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None


class ContentReportViewSet(viewsets.ModelViewSet):
    """
    API endpoint for creating and listing reports.
    Users can only see their own reports, staff can see all.
    """

    serializer_class = ContentReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Staff can see all reports
        if self.request.user.is_staff:
            return ContentReport.objects.all()
        # Regular users can only see their own reports
        return ContentReport.objects.filter(reporter=self.request.user)

    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user)

    @action(detail=True, methods=["post"])
    def review(self, request, pk=None):
        """
        Review a report with a verdict and optional note.
        Only staff members can review reports.
        Uses Celery for async processing.
        """
        if not request.user.is_staff:
            return Response(
                {"detail": "You do not have permission to review reports."},
                status=status.HTTP_403_FORBIDDEN,
            )

        report = self.get_object()
        verdict = request.data.get("verdict")
        note = request.data.get("note", "")

        if not verdict:
            return Response(
                {"verdict": ["This field is required."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if verdict not in dict(ContentReport.VERDICT_CHOICES):
            return Response(
                {"verdict": ["Invalid verdict choice."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if report is already reviewed
        if report.verdict != 'pending':
            return Response(
                {"detail": "This report has already been reviewed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Import here to avoid circular imports
            from .tasks import process_moderation_review
            
            # Queue the moderation task for async processing
            task = process_moderation_review.delay(
                report_id=pk,
                reviewer_id=request.user.id,
                verdict=verdict,
                note=note
            )
            
            logger.info(f"Queued moderation review task {task.id} for report {pk}")
            
            return Response({
                "detail": "Review submitted successfully and is being processed.",
                "task_id": task.id,
                "status": "processing"
            })
            
        except Exception as e:
            logger.error(f"Error queuing moderation review: {str(e)}", exc_info=True)
            return Response(
                {"detail": "An error occurred while submitting the review."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=["get"], url_path="task-status/(?P<task_id>[^/.]+)")
    def task_status(self, request, task_id=None):
        """
        Check the status of a moderation review task.
        Only staff members can check task status.
        """
        if not request.user.is_staff:
            return Response(
                {"detail": "You do not have permission to check task status."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            from celery.result import AsyncResult
            
            # Get task result
            task_result = AsyncResult(task_id)
            
            response_data = {
                "task_id": task_id,
                "status": task_result.status,
                "ready": task_result.ready(),
            }
            
            if task_result.ready():
                if task_result.successful():
                    response_data["result"] = task_result.result
                else:
                    response_data["error"] = str(task_result.result)
            
            return Response(response_data)
            
        except Exception as e:
            logger.error(f"Error checking task status {task_id}: {str(e)}", exc_info=True)
            return Response(
                {"detail": "An error occurred while checking task status."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=["get"])
    def content_types(self, request):
        """
        Get available content types for reporting.
        Returns a mapping of model names to their ContentType IDs.
        """
        try:
            content_types = {}

            # Get ContentType for Comment
            comment_type = ContentType.objects.get(app_label="blog", model="comment")
            content_types["comment"] = comment_type.id

            # Get ContentType for BlogPost
            post_type = ContentType.objects.get(app_label="blog", model="blogpost")
            content_types["post"] = post_type.id

            # Get ContentType for User
            user_type = ContentType.objects.get(app_label="users", model="customuser")
            content_types["user"] = user_type.id

            return Response(content_types)

        except ContentType.DoesNotExist as e:
            # Log available content types for debugging
            available_types = ContentType.objects.all().values_list(
                "app_label", "model"
            )
            print("Available ContentTypes:", list(available_types))
            raise e
