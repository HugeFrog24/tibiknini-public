import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver
from django.utils import timezone

from core.models import SiteInfo
from core.tasks import send_scheduled_email

from .models import Follow, Profile

logger = logging.getLogger(__name__)
User = get_user_model()


@receiver(post_save, sender=User)
def create_profile(sender, instance, created, **kwargs):
    """
    Signal to create a profile for a new user if one doesn't already exist.
    """
    if created and not hasattr(instance, "profile"):
        with transaction.atomic():
            Profile.objects.create(user=instance)


@receiver(post_save, sender=User)
def send_welcome_email(sender, instance, created, **kwargs):
    """
    Signal to send a welcome email when a new user is created.
    """
    if created:
        try:
            # Get site information for email context
            site_info = SiteInfo.objects.first()
            site_title = site_info.site_title if site_info else "Our Platform"

            context = {
                "username": instance.username,
                "site_title": site_title,
            }

            # Schedule the welcome email
            send_scheduled_email.delay(
                subject=f"Welcome to {site_title}!",
                recipient_list=[instance.email],
                template_name="emails/welcome_email.txt",
                context=context,
            )

        except Exception as e:
            logger.error(
                f"Failed to schedule welcome email for user {instance.username}: {str(e)}"
            )


@receiver(post_save, sender=User)
def send_password_change_notification(sender, instance, created, **kwargs):
    """
    Signal to send email and in-app notifications when a user changes their password.
    """
    if (
        not created
        and instance.has_usable_password()
        and hasattr(instance, "_password")
        and kwargs.get("update_fields") is None
    ):  # Ensure it's not just a fields update
        try:
            # Get site information for email context
            site_info = SiteInfo.objects.first()
            site_title = site_info.site_title if site_info else "Our Platform"

            # Get current timestamp
            change_time = timezone.now()
            change_datetime_str = change_time.strftime("%B %d, %Y at %I:%M %p %Z")

            context = {
                "username": instance.username,
                "site_title": site_title,
                "change_date": change_time.strftime("%B %d, %Y"),
                "change_time": change_time.strftime("%I:%M %p %Z"),
                "change_datetime": change_datetime_str,
            }

            # Schedule the password change notification email
            send_scheduled_email.delay(
                subject=f"Password Changed - {site_title}",
                recipient_list=[instance.email],
                template_name="emails/password_change_notification.txt",
                context=context,
            )

            # Create in-app notification
            from notifications.tasks import create_password_change_notification
            create_password_change_notification.delay(
                user_id=instance.id,
                change_datetime=change_datetime_str
            )

        except Exception as e:
            logger.error(
                f"Failed to schedule password change notifications: {str(e)}"
            )


@receiver(post_save, sender=Follow)
def send_follow_notification(sender, instance, created, **kwargs):
    """
    Signal to send an encouraging email when a user gets followed.
    """
    if created:
        try:
            # Get site information for email context
            site_info = SiteInfo.objects.first()
            site_title = site_info.site_title if site_info else "Our Platform"

            # Get follower's profile info
            follower = instance.follower
            following = instance.following

            context = {
                "username": following.username,
                "follower_username": follower.username,
                "site_title": site_title,
            }

            # Schedule the follow notification email
            send_scheduled_email.delay(
                subject=f"{follower.username} started following you on {site_title}",
                recipient_list=[following.email],
                template_name="emails/follow_notification.txt",
                context=context,
            )

        except Exception as e:
            logger.error(
                f"Failed to schedule follow notification email for user {following.username}: {str(e)}"
            )


@receiver(post_delete, sender=Profile)
def delete_profile_picture(sender, instance, **kwargs):
    """
    Signal to delete a profile picture when a profile is deleted.
    """
    try:
        instance.delete_image()
    except Exception as e:
        logger.error(f"Failed to delete profile picture for profile {instance.pk}: {e}")
