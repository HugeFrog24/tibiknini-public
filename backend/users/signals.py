import logging

from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.db import transaction
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver
from django.template.loader import render_to_string
from django.conf import settings

from core.models import SiteInfo
from .models import Profile

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

            # Ensure DEFAULT_FROM_EMAIL is properly set
            from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', None)
            if not from_email:
                raise ImproperlyConfigured("DEFAULT_FROM_EMAIL must be set in your Django settings.")

            # Prepare email content
            subject = f'Welcome to {site_title}!'
            message = render_to_string('emails/welcome_email.txt', {
                'username': instance.username,
                'site_title': site_title,
            })
            recipient_list = [instance.email]

            # Send email
            send_mail(
                subject,
                message,
                from_email,
                recipient_list,
                fail_silently=False,
            )
        except Exception as e:
            logger.error(f"Failed to send welcome email to {instance.email}: {e}")


@receiver(post_delete, sender=Profile)
def delete_profile_picture(sender, instance, **kwargs):
    """
    Signal to delete a profile picture when a profile is deleted.
    """
    try:
        instance.delete_image()
    except Exception as e:
        logger.error(f"Failed to delete profile picture for profile {instance.pk}: {e}")
