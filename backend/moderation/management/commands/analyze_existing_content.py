from django.core.management.base import BaseCommand
from django.contrib.contenttypes.models import ContentType
from blog.models import BlogPost
from moderation.content_analyzer import content_analyzer


class Command(BaseCommand):
    help = 'Analyze existing blog posts for inappropriate content'

    def add_arguments(self, parser):
        parser.add_argument(
            '--post-id',
            type=int,
            help='Analyze a specific post by ID',
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Analyze all existing posts',
        )

    def handle(self, *args, **options):
        if options['post_id']:
            try:
                post = BlogPost.objects.get(id=options['post_id'])
                self.analyze_post(post)
            except BlogPost.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'Post with ID {options["post_id"]} not found')
                )
        elif options['all']:
            posts = BlogPost.objects.filter(is_draft=False)
            self.stdout.write(f'Analyzing {posts.count()} posts...')
            
            for post in posts:
                self.analyze_post(post)
        else:
            self.stdout.write(
                self.style.ERROR('Please specify --post-id <ID> or --all')
            )

    def analyze_post(self, post):
        self.stdout.write(f'Analyzing post {post.id}: "{post.title}"')
        
        # Combine title and content for analysis
        full_content = f"{post.title}\n\n{post.content}"
        
        # Perform content analysis
        result = content_analyzer.analyze_content(full_content, post)
        
        if result['flagged_words']:
            self.stdout.write(
                self.style.WARNING(
                    f'  FLAGGED: Score {result["severity_score"]}, '
                    f'Max severity: {result["max_severity"]}, '
                    f'Flagged words: {len(result["flagged_words"])}'
                )
            )
            
            for flagged in result['flagged_words']:
                self.stdout.write(
                    f'    - "{flagged["word"]}" ({flagged["severity"]}) - '
                    f'{flagged["match_count"]} matches'
                )
                
            if result.get('auto_hide', False):
                self.stdout.write(
                    self.style.ERROR('  AUTO-HIDDEN due to critical violations')
                )
        else:
            self.stdout.write(
                self.style.SUCCESS('  CLEAN - No violations detected')
            )