import logging

from celery import shared_task
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone
from typing import Any

from .models import Notification, NotificationPreference, NotificationType

logger = logging.getLogger(__name__)
User = get_user_model()


@shared_task(bind=True, max_retries=3)
def create_notification(
    self,
    recipient_id: int,
    notification_type: str,
    title: str,
    message: str,
    actor_id: int | None = None,
    content_type_id: int | None = None,
    object_id: int | None = None,
    extra_data: dict[str, Any] | None = None
) -> dict[str, Any]:
    """
    Create a notification and handle delivery preferences.
    
    Args:
        recipient_id: ID of the user receiving the notification
        notification_type: Type of notification (from NotificationType choices)
        title: Notification title
        message: Notification message
        actor_id: ID of the user who triggered the notification (optional)
        content_type_id: ContentType ID for related object (optional)
        object_id: ID of the related object (optional)
        extra_data: Additional data as JSON (optional)
        
    Returns:
        Dictionary with success status and notification details
    """
    try:
        with transaction.atomic():
            # Get recipient and actor
            try:
                recipient = User.objects.get(id=recipient_id)
            except User.DoesNotExist:
                logger.error(f"Recipient user {recipient_id} not found")
                return {"success": False, "error": "Recipient not found"}
            
            actor = None
            if actor_id is not None:
                try:
                    actor = User.objects.get(id=actor_id)
                except User.DoesNotExist:
                    logger.warning(f"Actor user {actor_id} not found, proceeding without actor")
            
            # Get content type if provided
            content_type = None
            if content_type_id is not None:
                try:
                    content_type = ContentType.objects.get(id=content_type_id)
                except ContentType.DoesNotExist:
                    logger.warning(f"ContentType {content_type_id} not found")
            
            # Get or create notification preferences
            preferences, created = NotificationPreference.objects.get_or_create(
                user=recipient,
                defaults={}
            )
            
            # Check if user wants this type of notification
            if not preferences.should_send_inapp(notification_type):
                logger.info(f"User {recipient.username} has disabled {notification_type} notifications")
                return {
                    "success": True,
                    "skipped": True,
                    "reason": "User has disabled this notification type"
                }
            
            # Create the notification
            notification = Notification.objects.create(
                recipient=recipient,
                actor=actor,
                notification_type=notification_type,
                title=title,
                message=message,
                content_type=content_type,
                object_id=object_id,
                extra_data=extra_data or {}
            )
            
            logger.info(f"Created notification {notification.id} for user {recipient.username}")
            
            # Schedule email notification if user preferences allow
            if preferences.should_send_email(notification_type):
                transaction.on_commit(
                    lambda: send_notification_email.delay(notification.id)
                )
            
            return {
                "success": True,
                "notification_id": notification.id,
                "recipient": recipient.username,
                "type": notification_type,
                "created_at": notification.created_at.isoformat()
            }
            
    except ValidationError as e:
        error_msg = f"Validation error creating notification: {e}"
        logger.error(error_msg)
        return {"success": False, "error": error_msg}
    except Exception as exc:
        logger.error(f"Unexpected error creating notification: {str(exc)}", exc_info=True)
        
        # Retry with exponential backoff for transient errors
        if self.request.retries < self.max_retries:
            countdown = 60 * (2 ** self.request.retries)  # 60s, 120s, 240s
            logger.info(f"Retrying notification creation in {countdown} seconds (attempt {self.request.retries + 1})")
            raise self.retry(exc=exc, countdown=countdown)
        else:
            logger.error(f"Max retries exceeded for notification creation")
            return {"success": False, "error": f"Max retries exceeded: {str(exc)}"}


@shared_task(bind=True, max_retries=3)
def send_notification_email(self, notification_id: int)-> dict[str, Any]:
    """
    Send email notification if user preferences allow.
    
    Args:
        notification_id: ID of the notification to send via email
        
    Returns:
        Dictionary with success status and email details
    """
    try:
        notification = Notification.objects.get(id=notification_id)
        
        # Check if email was already sent
        if notification.email_sent:
            logger.info(f"Email already sent for notification {notification_id}")
            return {"success": True, "already_sent": True}
        
        # Import here to avoid circular imports
        from core.models import SiteInfo
        from core.tasks import send_scheduled_email
        
        # Get site information
        site_info = SiteInfo.objects.first()
        site_title = site_info.site_title if site_info else "Our Platform"
        
        # Prepare email context
        context = {
            'username': notification.recipient.username,
            'site_title': site_title,
            'notification_title': notification.title,
            'notification_message': notification.message,
            'actor_name': notification.get_actor_display_name(),
            'content_url': notification.get_content_url(),
            'notification_date': notification.created_at.strftime("%B %d, %Y at %I:%M %p %Z"),
            'notification_type': notification.get_notification_type_display(),
        }
        
        # Send the email
        send_scheduled_email.delay(
            subject=f"{notification.title} - {site_title}",
            recipient_list=[notification.recipient.email],
            template_name="notifications/emails/notification.txt",
            context=context,
        )
        
        # Mark email as sent
        notification.email_sent = True
        notification.save(update_fields=['email_sent'])
        
        logger.info(f"Scheduled email notification for user {notification.recipient.username}")
        
        return {
            "success": True,
            "notification_id": notification_id,
            "recipient": notification.recipient.username,
            "email": notification.recipient.email
        }
        
    except Notification.DoesNotExist:
        error_msg = f"Notification {notification_id} not found"
        logger.error(error_msg)
        return {"success": False, "error": error_msg}
    except Exception as exc:
        logger.error(f"Unexpected error sending notification email: {str(exc)}", exc_info=True)
        
        # Retry with exponential backoff for transient errors
        if self.request.retries < self.max_retries:
            countdown = 60 * (2 ** self.request.retries)  # 60s, 120s, 240s
            logger.info(f"Retrying email notification in {countdown} seconds (attempt {self.request.retries + 1})")
            raise self.retry(exc=exc, countdown=countdown)
        else:
            logger.error(f"Max retries exceeded for email notification")
            return {"success": False, "error": f"Max retries exceeded: {str(exc)}"}


@shared_task
def create_comment_notification(comment_id: int, post_author_id: int, commenter_id: int) -> dict[str, Any]:
    """
    Create a notification when someone comments on a post.
    
    Args:
        comment_id: ID of the comment
        post_author_id: ID of the post author
        commenter_id: ID of the person who commented
        
    Returns:
        Dictionary with success status
    """
    try:
        # Don't notify if user commented on their own post
        if post_author_id == commenter_id:
            return {"success": True, "skipped": True, "reason": "Self-comment"}
        
        # Get the comment and related objects
        from blog.models import Comment
        comment = Comment.objects.select_related('author', 'blog_post').get(id=comment_id)
        
        # Get content type for the comment
        content_type = ContentType.objects.get_for_model(Comment)
        
        # Create notification
        result = create_notification.delay(
            recipient_id=post_author_id,
            actor_id=commenter_id,
            notification_type=NotificationType.COMMENT_ON_POST,
            title=f"{comment.author.username} commented on your post",
            message=f'"{comment.content[:100]}{"..." if len(comment.content) > 100 else ""}"',
            content_type_id=content_type.id,
            object_id=comment_id,
            extra_data={
                'post_id': comment.blog_post.id,
                'post_title': comment.blog_post.title
            }
        )
        
        logger.info(f"Queued comment notification for post author {post_author_id}")
        return {"success": True, "task_id": result.id}
        
    except Exception as e:
        logger.error(f"Error creating comment notification: {e}")
        return {"success": False, "error": str(e)}


@shared_task
def create_follow_notification(follower_id: int, followed_id: int) -> dict[str, Any]:
    """
    Create a notification when someone follows a user.
    
    Args:
        follower_id: ID of the user who followed
        followed_id: ID of the user being followed
        
    Returns:
        Dictionary with success status
    """
    try:
        # Get the follower
        follower = User.objects.get(id=follower_id)
        
        # Get content type for the follow relationship
        from users.models import Follow
        content_type = ContentType.objects.get_for_model(Follow)
        
        # Find the follow object
        follow = Follow.objects.get(follower_id=follower_id, following_id=followed_id)
        
        # Create notification
        result = create_notification.delay(
            recipient_id=followed_id,
            actor_id=follower_id,
            notification_type=NotificationType.NEW_FOLLOWER,
            title=f"{follower.username} started following you",
            message=f"{follower.username} is now following your updates.",
            content_type_id=content_type.id,
            object_id=follow.id,
            extra_data={
                'follower_username': follower.username
            }
        )
        
        logger.info(f"Queued follow notification for user {followed_id}")
        return {"success": True, "task_id": result.id}
        
    except Exception as e:
        logger.error(f"Error creating follow notification: {e}")
        return {"success": False, "error": str(e)}


@shared_task
def create_password_change_notification(user_id: int, change_datetime: str) -> dict[str, Any]:
    """
    Create a notification for password change.
    
    Args:
        user_id: ID of the user who changed their password
        change_datetime: Formatted datetime string of when the password was changed
        
    Returns:
        Dictionary with success status
    """
    try:
        # Create notification using the general notification task
        result = create_notification.delay(
            recipient_id=user_id,
            notification_type=NotificationType.PASSWORD_CHANGED,
            title='Password Changed',
            message=f'Your password was successfully changed on {change_datetime}.',
            extra_data={
                'change_datetime': change_datetime,
                'security_action': True
            }
        )
        
        logger.info(f"Queued password change notification for user {user_id}")
        return {"success": True, "task_id": result.id}
        
    except Exception as e:
        logger.error(f"Error creating password change notification: {e}")
        return {"success": False, "error": str(e)}


@shared_task
def cleanup_old_notifications(days: int = 30) -> dict[str, Any]:
    """
    Clean up old read notifications.
    
    Args:
        days: Number of days to keep read notifications (default: 30)
        
    Returns:
        Dictionary with cleanup results
    """
    try:
        from datetime import timedelta
        
        cutoff_date = timezone.now() - timedelta(days=days)
        
        # Delete old read notifications
        deleted_count, _ = Notification.objects.filter(
            is_read=True,
            read_at__lt=cutoff_date
        ).delete()
        
        logger.info(f"Cleaned up {deleted_count} old notifications")
        
        return {
            "success": True,
            "deleted_count": deleted_count,
            "cutoff_date": cutoff_date.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error cleaning up notifications: {e}")
        return {"success": False, "error": str(e)}


@shared_task
def mark_notifications_as_read(
    user_id: int,
    notification_ids: list[int] | None = None
) -> dict[str, Any]:
    """
    Mark notifications as read for a user.
    
    Args:
        user_id: ID of the user
        notification_ids: List of specific notification IDs to mark as read (optional)
        
    Returns:
        Dictionary with success status and count
    """
    try:
        queryset = Notification.objects.filter(recipient_id=user_id, is_read=False)
        
        if notification_ids is not None:
            queryset = queryset.filter(id__in=notification_ids)
        
        updated_count = queryset.update(
            is_read=True,
            read_at=timezone.now()
        )
        
        logger.info(f"Marked {updated_count} notifications as read for user {user_id}")
        
        return {
            "success": True,
            "updated_count": updated_count,
            "user_id": user_id
        }
        
    except Exception as e:
        logger.error(f"Error marking notifications as read: {e}")
        return {"success": False, "error": str(e)}