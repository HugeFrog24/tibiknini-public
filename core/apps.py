from django.apps import AppConfig

class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'

    def ready(self):
        from django.conf import settings
        from core.models import SMTPSettings
        
        try:
            smtp_config = SMTPSettings.objects.first()
            if smtp_config:
                settings.EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
                settings.EMAIL_HOST = smtp_config.host
                settings.EMAIL_PORT = smtp_config.port
                settings.EMAIL_HOST_USER = smtp_config.username
                settings.EMAIL_HOST_PASSWORD = smtp_config.password
                settings.EMAIL_USE_TLS = smtp_config.use_tls
                settings.DEFAULT_FROM_EMAIL = smtp_config.from_email
        except Exception:
            settings.EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
