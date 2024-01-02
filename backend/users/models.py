import uuid
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.core.files.storage import default_storage
from django.db import models
from django.utils.translation import gettext_lazy as _

from .managers import CustomUserManager
from .utils import process_profile_image, rename_profile_picture
from .validators import username_validator, validate_reserved_username, validate_image_file_size


class CustomUser(AbstractUser):
    REQUIRED_FIELDS = ['email']

    username = models.CharField(
        _('username'),
        max_length=30,
        unique=True,
        help_text=_('Required. 30 characters or fewer. Lowercase letters, digits and ./-/_ only.'),
        validators=[username_validator, validate_reserved_username],
        error_messages={
            'unique': _("A user with that username already exists."),
        },
    )

    email = models.EmailField(_('email address'), unique=True, blank=False, null=False)
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    agreed_tos_version = models.IntegerField(default=0)
    password_change_required = models.BooleanField(default=False)
    password_changed_date = models.DateTimeField(auto_now_add=True)

    objects = CustomUserManager()

    def save(self, *args, **kwargs):
        self.username = self.username.lower()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.username


class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    image = models.ImageField(
        upload_to=rename_profile_picture,
        null=True, blank=True,
        validators=[validate_image_file_size]
    )
    bio = models.CharField(max_length=256, blank=True)

    def __str__(self):
        return f'{self.user.username} Profile'

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

        if self.image:
            process_profile_image(self.image.path)

    def delete_image(self):
        if self.image:
            default_storage.delete(self.image.path)
            self.image = None
            self.save()


class Follow(models.Model):
    follower = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='following')
    following = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='followers')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('follower', 'following')

    def __str__(self):
        return f'{self.follower} follows {self.following}'
