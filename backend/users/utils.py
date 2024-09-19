import uuid
from pathlib import Path

from django.core.exceptions import ValidationError
from django.core.files.storage import default_storage
from django.utils import timezone
from PIL import Image

from .validators import validate_image_extension, validate_image_file


def rename_profile_picture(instance, filename):
    ext = Path(filename).suffix
    validate_image_extension(ext)
    new_filename = f"{uuid.uuid4().hex}-{timezone.now().strftime('%Y%m%d-%H%M%S')}{ext}"
    return Path(f"profile_pics/{instance.user.uuid}/{new_filename}")


def process_profile_image(image_path):
    try:
        validate_image_file(image_path)
    except ValidationError:
        default_storage.delete(image_path)
        return

    img = Image.open(image_path)
    if img.height > 300 or img.width > 300:
        output_size = (300, 300)
        img.thumbnail(output_size)

    img = img.convert("RGB")
    img.save(image_path, format="JPEG", quality=90)
