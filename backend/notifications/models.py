from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.utils import timezone

User = get_user_model()


class NotificationType(models.TextChoices):
    # Comment notifications
    COMMENT_ON_POST = 'comment_on_post', 'Comment on Post'
    REPLY_TO_COMMENT = 'reply_to_comment', 'Reply to Comment'
    COMMENT_LIKED = 'comment_liked', 'Comment Liked'
    
    # Follow notifications
    NEW_FOLLOWER = 'new_follower', 'New Follower'
    FOLLOWED_USER_POSTED = 'followed_user_posted', 'Followed User Posted'
    
    # Post notifications
    POST_LIKED = 'post_liked', 'Post Liked'
    POST_SHARED = 'post_shared', 'Post Shared'
    
    # System notifications
    PASSWORD_CHANGED = 'password_changed', 'Password Changed'
    SECURITY_ALERT = 'security_alert', 'Security Alert'
    CONTENT_MODERATED = 'content_moderated', 'Content Moderated'
    
    # Subscription notifications
    WEEKLY_DIGEST = 'weekly_digest', 'Weekly Digest'
    SUBSCRIPTION_POST = 'subscription_post', 'Subscription Post'


class Notification(models.Model):
    # Core fields
    recipient = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='notifications'
    )
    actor = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='actions', 
        null=True, 
        blank=True
    )
    
    # Notification type and content
    notification_type = models.CharField(
        max_length=50, 
        choices=NotificationType.choices
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    
    # Generic foreign key for related objects
    content_type = models.ForeignKey(
        ContentType, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True
    )
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Status and metadata
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Delivery preferences
    email_sent = models.BooleanField(default=False)
    push_sent = models.BooleanField(default=False)
    
    # Additional data (JSON field for flexible metadata)
    extra_data = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', '-created_at']),
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['notification_type']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.recipient.username}"
    
    def mark_as_read(self):
        """Mark notification as read"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])
    
    def get_actor_display_name(self):
        """Get display name for the actor"""
        if self.actor:
            return self.actor.username
        return "System"
    
    def get_content_url(self):
        """Get URL for the related content object"""
        if self.content_object and self.content_type:
            if hasattr(self.content_object, 'get_absolute_url'):
                return self.content_object.get_absolute_url()
            # Handle specific content types
            if self.content_type.model == 'blogpost':
                return f"/blog/posts/{self.object_id}/"
            elif self.content_type.model == 'comment':
                # Get the blog post URL for the comment
                if hasattr(self.content_object, 'blog_post'):
                    return f"/blog/posts/{self.content_object.blog_post.id}/"
        return None


class NotificationPreference(models.Model):
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='notification_preferences'
    )
    
    # Email preferences
    email_comments = models.BooleanField(default=True)
    email_follows = models.BooleanField(default=True)
    email_likes = models.BooleanField(default=False)
    email_system = models.BooleanField(default=True)
    email_digest = models.BooleanField(default=True)
    
    # In-app preferences
    inapp_comments = models.BooleanField(default=True)
    inapp_follows = models.BooleanField(default=True)
    inapp_likes = models.BooleanField(default=True)
    inapp_system = models.BooleanField(default=True)
    
    # Push notification preferences (for future mobile app)
    push_comments = models.BooleanField(default=False)
    push_follows = models.BooleanField(default=False)
    push_likes = models.BooleanField(default=False)
    push_system = models.BooleanField(default=False)
    
    # Digest preferences
    digest_frequency = models.CharField(
        max_length=20,
        choices=[
            ('daily', 'Daily'),
            ('weekly', 'Weekly'),
            ('monthly', 'Monthly'),
            ('never', 'Never'),
        ],
        default='weekly'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Notification preferences for {self.user.username}"
    
    def should_send_email(self, notification_type):
        """Check if email should be sent for this notification type"""
        type_mapping = {
            NotificationType.COMMENT_ON_POST: self.email_comments,
            NotificationType.REPLY_TO_COMMENT: self.email_comments,
            NotificationType.COMMENT_LIKED: self.email_likes,
            NotificationType.NEW_FOLLOWER: self.email_follows,
            NotificationType.FOLLOWED_USER_POSTED: self.email_follows,
            NotificationType.POST_LIKED: self.email_likes,
            NotificationType.POST_SHARED: self.email_likes,
            NotificationType.PASSWORD_CHANGED: self.email_system,
            NotificationType.SECURITY_ALERT: self.email_system,
            NotificationType.CONTENT_MODERATED: self.email_system,
            NotificationType.WEEKLY_DIGEST: self.email_digest,
            NotificationType.SUBSCRIPTION_POST: self.email_follows,
        }
        return type_mapping.get(notification_type, False)
    
    def should_send_inapp(self, notification_type):
        """Check if in-app notification should be sent for this notification type"""
        type_mapping = {
            NotificationType.COMMENT_ON_POST: self.inapp_comments,
            NotificationType.REPLY_TO_COMMENT: self.inapp_comments,
            NotificationType.COMMENT_LIKED: self.inapp_likes,
            NotificationType.NEW_FOLLOWER: self.inapp_follows,
            NotificationType.FOLLOWED_USER_POSTED: self.inapp_follows,
            NotificationType.POST_LIKED: self.inapp_likes,
            NotificationType.POST_SHARED: self.inapp_likes,
            NotificationType.PASSWORD_CHANGED: self.inapp_system,
            NotificationType.SECURITY_ALERT: self.inapp_system,
            NotificationType.CONTENT_MODERATED: self.inapp_system,
            NotificationType.WEEKLY_DIGEST: False,  # Digest is email-only
            NotificationType.SUBSCRIPTION_POST: self.inapp_follows,
        }
        return type_mapping.get(notification_type, True)


# Signal to create default notification preferences for new users
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=User)
def create_notification_preferences(sender, instance, created, **kwargs):
    """Create default notification preferences for new users"""
    if created:
        NotificationPreference.objects.create(user=instance)
