from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.contenttypes.models import ContentType
from .models import ReportReason, ContentReport
from .serializers import ReportReasonSerializer, ContentReportSerializer

# Create your views here.

class ReportReasonViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for listing active report reasons.
    Only authenticated users can view reasons.
    """
    queryset = ReportReason.objects.filter(is_active=True)
    serializer_class = ReportReasonSerializer
    permission_classes = [permissions.IsAuthenticated]

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
