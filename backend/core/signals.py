from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.template.loader import render_to_string
from django.utils import timezone

from .models import PrivacyPolicy, SiteInfo, TermsOfService
from .tasks import send_scheduled_email

User = get_user_model()


def schedule_policy_change_notifications(policy_instance, policy_type):
    """Schedule email notifications for all users about policy changes"""
    users = User.objects.filter(is_active=True)
    site_info = SiteInfo.objects.first()

    context = {
        "policy_type": policy_type,
        "version": policy_instance.version,
        "effective_date": policy_instance.effective_date.strftime("%Y-%m-%d"),
        "site_title": site_info.site_title if site_info else "Support",
    }

    # Calculate when to send the notification (e.g., 7 days before effective date)
    notification_date = policy_instance.effective_date - timezone.timedelta(days=7)

    # Schedule notifications for each user
    for user in users:
        context["user"] = user
        send_scheduled_email.apply_async(
            args=[
                f"Important: {policy_type} Update",
                [user.email],
                "emails/policy_update.html",
                context,
            ],
            eta=notification_date,
        )


@receiver(post_save, sender=PrivacyPolicy)
def notify_privacy_policy_update(sender, instance, created, **kwargs):
    if created:  # Only for new versions
        schedule_policy_change_notifications(instance, "Privacy Policy")


@receiver(post_save, sender=TermsOfService)
def notify_tos_update(sender, instance, created, **kwargs):
    if created:  # Only for new versions
        schedule_policy_change_notifications(instance, "Terms of Service")
