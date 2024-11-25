from django.core.management.base import BaseCommand
from django.core.management import call_command
from moderation.models import ReportReason

class Command(BaseCommand):
    help = 'Initialize default report reasons if they do not exist'

    def handle(self, *args, **kwargs):
        existing_count = ReportReason.objects.count()
        
        if existing_count == 0:
            self.stdout.write('No report reasons found. Loading defaults...')
            call_command('loaddata', 'default_report_reasons', app_label='moderation')
            self.stdout.write(self.style.SUCCESS('Successfully loaded default report reasons'))
        else:
            self.stdout.write(self.style.WARNING(
                f'Found {existing_count} existing report reasons. Skipping initialization.'
            ))
            self.stdout.write(
                'To force reload defaults, first remove existing reasons or use loaddata command directly'
            )
