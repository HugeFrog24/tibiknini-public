from django.core.management.base import BaseCommand
from django.core.management import call_command


class Command(BaseCommand):
    help = 'Load default bad words for content moderation'

    def handle(self, *args, **options):
        self.stdout.write('Loading default bad words...')
        
        try:
            call_command('loaddata', 'default_bad_words.json')
            self.stdout.write(
                self.style.SUCCESS('Successfully loaded default bad words')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Failed to load bad words: {str(e)}')
            )