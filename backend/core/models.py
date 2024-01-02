from django.db import models


class SiteInfoType(models.TextChoices):
    PRIVACY_POLICY = 'PRIVACY_POLICY', 'Privacy Policy'
    TERMS_OF_SERVICE = 'TERMS_OF_SERVICE', 'Terms of Service'


class SiteInfo(models.Model):
    type = models.CharField(
        max_length=20, choices=SiteInfoType.choices, unique=True, default=SiteInfoType.PRIVACY_POLICY
    )
    site_title = models.CharField(max_length=255)
    site_description = models.TextField()
    content = models.TextField()
    tos_version = models.IntegerField(default=0)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.site_title
