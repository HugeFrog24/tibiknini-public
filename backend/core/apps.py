from django.apps import AppConfig
from django.db import DatabaseError


class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "core"

    def ready(self):
        try:
            # Import here to avoid circular imports
            from django.conf import settings

            from .models import SMTPSettings

            # Try to get SMTP settings from database
            smtp_settings = SMTPSettings.objects.first()
            if smtp_settings and smtp_settings.is_configured:
                # Update Django's email settings
                settings.EMAIL_HOST = smtp_settings.host
                settings.EMAIL_PORT = smtp_settings.port
                settings.EMAIL_HOST_USER = smtp_settings.username
                settings.EMAIL_HOST_PASSWORD = smtp_settings.password
                settings.EMAIL_USE_TLS = smtp_settings.use_tls
                settings.DEFAULT_FROM_EMAIL = smtp_settings.from_email
                settings.EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
        except DatabaseError:
            # Database might not be ready during migrations
            pass
        except Exception as e:
            # Log any other errors but don't prevent app from starting
            import logging

            logger = logging.getLogger(__name__)
            logger.error(f"Failed to load SMTP settings: {str(e)}")
