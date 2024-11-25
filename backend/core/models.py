from django.core.exceptions import ValidationError
from django.db import models


class SiteInfo(models.Model):
    site_title = models.CharField(max_length=255)
    site_description = models.TextField()
    last_updated = models.DateTimeField(
        auto_now_add=True, null=True
    )  # Allow null values

    def __str__(self):
        return self.site_title


class PrivacyPolicy(models.Model):
    content = models.TextField()
    version = models.IntegerField(default=1)
    last_updated = models.DateTimeField(auto_now=True)
    title = models.CharField(max_length=50, default="Privacy Policy")

    def __str__(self):
        return f"{self.title} v{self.version}"

    def get_content(self):
        site_name = SiteInfo.objects.first().site_title
        return self.content.replace("{SITE_NAME}", site_name)


class TermsOfService(models.Model):
    content = models.TextField()
    version = models.IntegerField(default=1)
    last_updated = models.DateTimeField(auto_now=True)
    title = models.CharField(max_length=50, default="Terms of Service")

    def __str__(self):
        return f"{self.title} v{self.version}"

    def get_content(self):
        site_name = SiteInfo.objects.first().site_title
        return self.content.replace("{SITE_NAME}", site_name)


class SMTPSettings(models.Model):
    host = models.CharField(max_length=255)
    port = models.IntegerField()
    username = models.CharField(max_length=255)
    password = models.CharField(max_length=255)
    use_tls = models.BooleanField(default=True)
    from_email = models.EmailField()

    class Meta:
        verbose_name = "SMTP Settings"
        verbose_name_plural = "SMTP Settings"

    def save(self, *args, **kwargs):
        if not self.pk and SMTPSettings.objects.exists():
            raise ValidationError("Only one SMTP settings instance can exist.")

        super().save(*args, **kwargs)

        # Update Django's email settings after saving
        from django.conf import settings

        settings.EMAIL_HOST = self.host
        settings.EMAIL_PORT = self.port
        settings.EMAIL_HOST_USER = self.username
        settings.EMAIL_HOST_PASSWORD = self.password
        settings.EMAIL_USE_TLS = self.use_tls
        settings.DEFAULT_FROM_EMAIL = self.from_email
        settings.EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"

    def __str__(self):
        return f"SMTP Configuration ({self.host})"
