from django.db import models


class SiteInfo(models.Model):
    site_title = models.CharField(max_length=255)
    site_description = models.TextField()
    last_updated = models.DateTimeField(auto_now_add=True, null=True)  # Allow null values

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
