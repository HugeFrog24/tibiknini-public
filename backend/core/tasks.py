from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone

from core.models import SiteInfo


@shared_task
def send_scheduled_email(subject, recipient_list, template_name, context):
    """
    Generic task for sending scheduled emails
    """
    try:
        site_info = SiteInfo.objects.first()
        site_title = site_info.site_title if site_info else "Support"
        from_email = f"{site_title} <{settings.DEFAULT_FROM_EMAIL}>"

        message = render_to_string(template_name, context)
        send_mail(
            subject=subject,
            message=message,
            from_email=from_email,
            recipient_list=recipient_list,
            fail_silently=False,
        )
        return f"Email sent successfully to {', '.join(recipient_list)}"
    except Exception as e:
        return f"Failed to send email: {str(e)}"
