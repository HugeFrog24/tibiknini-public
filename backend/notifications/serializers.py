from rest_framework import serializers
from django.contrib.auth import get_user_model

from .models import Notification, NotificationPreference, NotificationType

User = get_user_model()


class NotificationActorSerializer(serializers.ModelSerializer):
    """Serializer for the actor (user who triggered the notification)"""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'image']


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for notifications"""
    
    actor = NotificationActorSerializer(read_only=True)
    notification_type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    content_url = serializers.CharField(source='get_content_url', read_only=True)
    actor_display_name = serializers.CharField(source='get_actor_display_name', read_only=True)
    time_since = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id',
            'title',
            'message',
            'notification_type',
            'notification_type_display',
            'actor',
            'actor_display_name',
            'is_read',
            'created_at',
            'read_at',
            'content_url',
            'extra_data',
            'time_since'
        ]
        read_only_fields = [
            'id',
            'title',
            'message',
            'notification_type',
            'actor',
            'created_at',
            'read_at',
            'content_url',
            'extra_data'
        ]
    
    def get_time_since(self, obj):
        """Get human-readable time since notification was created"""
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff < timedelta(minutes=1):
            return "Just now"
        elif diff < timedelta(hours=1):
            minutes = int(diff.total_seconds() / 60)
            return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
        elif diff < timedelta(days=1):
            hours = int(diff.total_seconds() / 3600)
            return f"{hours} hour{'s' if hours != 1 else ''} ago"
        elif diff < timedelta(days=7):
            days = diff.days
            return f"{days} day{'s' if days != 1 else ''} ago"
        elif diff < timedelta(days=30):
            weeks = diff.days // 7
            return f"{weeks} week{'s' if weeks != 1 else ''} ago"
        else:
            months = diff.days // 30
            return f"{months} month{'s' if months != 1 else ''} ago"


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """Serializer for notification preferences"""
    
    class Meta:
        model = NotificationPreference
        fields = [
            'email_comments',
            'email_follows',
            'email_likes',
            'email_system',
            'email_digest',
            'inapp_comments',
            'inapp_follows',
            'inapp_likes',
            'inapp_system',
            'push_comments',
            'push_follows',
            'push_likes',
            'push_system',
            'digest_frequency'
        ]


class MarkAsReadSerializer(serializers.Serializer):
    """Serializer for marking notifications as read"""
    
    notification_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text="List of notification IDs to mark as read. If not provided, all notifications will be marked as read."
    )


class NotificationStatsSerializer(serializers.Serializer):
    """Serializer for notification statistics"""
    
    total_count = serializers.IntegerField()
    unread_count = serializers.IntegerField()
    read_count = serializers.IntegerField()
    recent_count = serializers.IntegerField(help_text="Notifications from last 24 hours")
    by_type = serializers.DictField(help_text="Count of notifications by type")