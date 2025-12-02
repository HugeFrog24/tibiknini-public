from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Count, Q
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from .models import Notification, NotificationPreference
from .serializers import (
    NotificationSerializer,
    NotificationPreferenceSerializer,
    MarkAsReadSerializer,
    NotificationStatsSerializer
)
from .tasks import mark_notifications_as_read


class NotificationPagination(PageNumberPagination):
    """Custom pagination for notifications"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class NotificationListView(generics.ListAPIView):
    """
    List notifications for the authenticated user.
    
    Query parameters:
    - unread_only: boolean - Only return unread notifications
    - notification_type: string - Filter by notification type
    - page: int - Page number
    - page_size: int - Number of notifications per page (max 100)
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = NotificationPagination
    
    def get_queryset(self):
        user = self.request.user
        queryset = Notification.objects.filter(recipient=user).select_related('actor')
        
        # Filter by read status
        unread_only = self.request.query_params.get('unread_only', '').lower() == 'true'
        if unread_only:
            queryset = queryset.filter(is_read=False)
        
        # Filter by notification type
        notification_type = self.request.query_params.get('notification_type')
        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)
        
        return queryset.order_by('-created_at')


class NotificationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a specific notification.
    Only the is_read field can be updated.
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)
    
    def perform_update(self, serializer):
        # Only allow updating is_read field
        instance = serializer.instance
        if 'is_read' in serializer.validated_data:
            if serializer.validated_data['is_read'] and not instance.is_read:
                instance.mark_as_read()
            elif not serializer.validated_data['is_read'] and instance.is_read:
                instance.is_read = False
                instance.read_at = None
                instance.save(update_fields=['is_read', 'read_at'])


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_notifications_read(request):
    """
    Mark notifications as read for the authenticated user.
    
    Body parameters:
    - notification_ids: array of integers (optional) - Specific notification IDs to mark as read
    
    If notification_ids is not provided, all unread notifications will be marked as read.
    """
    serializer = MarkAsReadSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    notification_ids = serializer.validated_data.get('notification_ids')
    
    # Queue the async task
    task = mark_notifications_as_read.delay(request.user.id, notification_ids)
    
    return Response({
        'success': True,
        'task_id': task.id,
        'message': 'Notifications are being marked as read'
    }, status=status.HTTP_202_ACCEPTED)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def notification_stats(request):
    """
    Get notification statistics for the authenticated user.
    
    Returns:
    - total_count: Total number of notifications
    - unread_count: Number of unread notifications
    - read_count: Number of read notifications
    - recent_count: Number of notifications from last 24 hours
    - by_type: Count of notifications by type
    """
    user = request.user
    
    # Get basic counts
    total_count = Notification.objects.filter(recipient=user).count()
    unread_count = Notification.objects.filter(recipient=user, is_read=False).count()
    read_count = total_count - unread_count
    
    # Get recent notifications (last 24 hours)
    from datetime import timedelta
    recent_cutoff = timezone.now() - timedelta(hours=24)
    recent_count = Notification.objects.filter(
        recipient=user,
        created_at__gte=recent_cutoff
    ).count()
    
    # Get count by notification type
    type_counts = Notification.objects.filter(recipient=user).values(
        'notification_type'
    ).annotate(count=Count('id')).order_by('-count')
    
    by_type = {item['notification_type']: item['count'] for item in type_counts}
    
    stats_data = {
        'total_count': total_count,
        'unread_count': unread_count,
        'read_count': read_count,
        'recent_count': recent_count,
        'by_type': by_type
    }
    
    serializer = NotificationStatsSerializer(stats_data)
    return Response(serializer.data)


class NotificationPreferenceView(generics.RetrieveUpdateAPIView):
    """
    Retrieve and update notification preferences for the authenticated user.
    """
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        # Get or create notification preferences for the user
        preferences, created = NotificationPreference.objects.get_or_create(
            user=self.request.user
        )
        return preferences


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def unread_count(request):
    """
    Get the count of unread notifications for the authenticated user.
    This is a lightweight endpoint for real-time updates.
    """
    count = Notification.objects.filter(
        recipient=request.user,
        is_read=False
    ).count()
    
    return Response({'unread_count': count})


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def clear_all_notifications(request):
    """
    Delete all notifications for the authenticated user.
    This action cannot be undone.
    """
    deleted_count, _ = Notification.objects.filter(recipient=request.user).delete()
    
    return Response({
        'success': True,
        'deleted_count': deleted_count,
        'message': f'Deleted {deleted_count} notifications'
    })


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def clear_read_notifications(request):
    """
    Delete all read notifications for the authenticated user.
    This helps keep the notification list clean.
    """
    deleted_count, _ = Notification.objects.filter(
        recipient=request.user,
        is_read=True
    ).delete()
    
    return Response({
        'success': True,
        'deleted_count': deleted_count,
        'message': f'Deleted {deleted_count} read notifications'
    })
