from django.core.management.base import BaseCommand
from ...views import load_default_navbar_items


class Command(BaseCommand):
    help = 'Sets up initial data for the Django project'

    def handle(self, *args, **options):
        # Load default navbar items
        load_default_navbar_items()
        self.stdout.write(self.style.SUCCESS('Initial data setup completed'))
