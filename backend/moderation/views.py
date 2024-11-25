from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.contenttypes.models import ContentType
from .models import ReportReason, ContentReport
from .serializers import ReportReasonSerializer, ContentReportSerializer
from rest_framework import status

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

    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        """
        Review a report with a verdict and optional note.
        Only staff members can review reports.
        """
        if not request.user.is_staff:
            return Response(
                {"detail": "You do not have permission to review reports."},
                status=status.HTTP_403_FORBIDDEN
            )

        report = self.get_object()
        verdict = request.data.get('verdict')
        note = request.data.get('note', '')

        if not verdict:
            return Response(
                {"verdict": ["This field is required."]},
                status=status.HTTP_400_BAD_REQUEST
            )

        if verdict not in dict(ContentReport.VERDICT_CHOICES):
            return Response(
                {"verdict": ["Invalid verdict choice."]},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            report.review(reviewer=request.user, verdict=verdict, note=note)
            return Response({"detail": "Report reviewed successfully."})
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def content_types(self, request):
        """
        Get available content types for reporting.
        Returns a mapping of model names to their ContentType IDs.
        """
        try:
            content_types = {}
            
            # Get ContentType for Comment
            comment_type = ContentType.objects.get(app_label='blog', model='comment')
            content_types['comment'] = comment_type.id
            
            # Get ContentType for BlogPost
            post_type = ContentType.objects.get(app_label='blog', model='blogpost')
            content_types['post'] = post_type.id
            
            # Get ContentType for User
            user_type = ContentType.objects.get(app_label='users', model='customuser')
            content_types['user'] = user_type.id
            
            return Response(content_types)
            
        except ContentType.DoesNotExist as e:
            # Log available content types for debugging
            available_types = ContentType.objects.all().values_list('app_label', 'model')
            print("Available ContentTypes:", list(available_types))
            raise e
