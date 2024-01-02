from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from PIL import Image
from django.core.validators import RegexValidator
from django.utils.translation import gettext_lazy as _

ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif'}


def validate_image_extension(ext):
    if ext.lower() not in ALLOWED_EXTENSIONS:
        raise ValidationError("Unsupported file format")


def validate_image_file(image_path):
    try:
        Image.open(image_path)
    except IOError:
        raise ValidationError("Invalid image file")


username_validator = RegexValidator(
    r'^[a-z0-9\.\-_]+$',
    _('Enter a valid username. This value may contain only lowercase letters, '
      'numbers, and ./-/_ characters.')
)


def validate_image_file_size(image):
    if image.size > 2 * 1024 * 1024:  # 2 MB
        raise ValidationError("The maximum image size that can be uploaded is 2 MB")


def validate_reserved_username(value):
    reserved_usernames = ["me", "none", "null", "undefined", "bot", "root", "support", "system"]
    if value.lower() in reserved_usernames:
        raise ValidationError("This username is reserved and cannot be used")


def validate_unique_username(value, user_instance=None):
    User = get_user_model()
    matching_users = User.objects.filter(username__iexact=value)

    if user_instance:
        if matching_users.exists() and matching_users.first().pk != user_instance.pk:
            raise ValidationError("Username already taken")
    else:
        if matching_users.exists():
            raise ValidationError("Username already taken")
