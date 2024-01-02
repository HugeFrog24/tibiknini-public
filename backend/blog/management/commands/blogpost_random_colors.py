from django.core.management.base import BaseCommand
from blog.models import BlogPost
from blog.utils import get_random_accent_color


class Command(BaseCommand):
    help = 'Assigns a random hex color to each existing blog post'

    def handle(self, *args, **kwargs):
        # Loop over each blog post
        for post in BlogPost.objects.all():
            # Assign the random color from the utility function to the accent_color field of the blog post
            post.accent_color = get_random_accent_color()
            post.save()

        self.stdout.write(self.style.SUCCESS('Successfully updated accent colors for all blog posts!'))
