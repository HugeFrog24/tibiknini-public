from pathlib import Path

from django.core.management.base import BaseCommand
from django.conf import settings
from users.models import Profile  # replace 'your_app_name' with your actual app name


class Command(BaseCommand):
    help = 'Removes obsolete profile pictures'

    def handle(self, *args, **kwargs):
        media_root = Path(settings.MEDIA_ROOT)

        # This assumes that the image field on your Profile model saves images in a directory named 'images'
        # If your setup is different, you will need to adjust this path accordingly
        profile_images_directory = media_root / 'profile_pics'

        if profile_images_directory.exists() and profile_images_directory.is_dir():
            current_profile_images = Profile.objects.exclude(image__isnull=True).exclude(image__exact='').values_list('image', flat=True)
            current_profile_images = set((media_root / img).resolve() for img in current_profile_images)

            for image_path in profile_images_directory.glob('**/*'):
                if image_path.is_file() and image_path.resolve() not in current_profile_images:
                    image_path.unlink()

        self.stdout.write(self.style.SUCCESS('Obsolete profile pictures have been successfully removed.'))
