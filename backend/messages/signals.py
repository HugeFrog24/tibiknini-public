from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from .models import ContactMessage


@receiver(post_save, sender=ContactMessage)
def send_email_notification(sender, instance, created, **kwargs):
    if created:  # Only send email for new messages
        # Send notification to the support email
        support_subject = 'New Contact Form Message'
        support_message = (
            f'You have a new message from: {instance.name} <{instance.email}>.\n'
            f'Subject: {instance.subject}.\n'
            f'Message: {instance.message}'
        )
        send_mail(support_subject, support_message, settings.EMAIL_HOST_USER, [settings.EMAIL_HOST_USER])

        # Send confirmation and a copy of the message to the sender
        sender_subject = 'Your message has been received'
        sender_message = (
            f'Dear {instance.name},\n\n'
            f'Thank you for contacting us. We have received your message and will respond as soon as possible.\n\n'
            f'Here is a copy of your message for your reference:\n'
            f'Subject: {instance.subject}\n'
            f'Message: {instance.message}\n\n'
            f'Best regards,\n'
            f'The Team'
        )
        send_mail(sender_subject, sender_message, settings.EMAIL_HOST_USER, [instance.email])
