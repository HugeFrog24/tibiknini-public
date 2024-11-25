from django.conf import settings
from django.db import models
from django.utils import timezone

# Create your models here.


class UserPresence(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    last_seen = models.DateTimeField(default=timezone.now)
    is_online = models.BooleanField(default=False)
    channel_name = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f"{self.user.username} - {'Online' if self.is_online else 'Offline'}"

    class Meta:
        verbose_name = "User Presence"
        verbose_name_plural = "User Presences"
