"""
Celery configuration for blog app tasks.
"""

from celery import Celery
from django.conf import settings

# Blog-specific task routing
BLOG_TASK_ROUTES = {
    'blog.tasks.process_blog_post_creation': {'queue': 'blog_posts'},
    'blog.tasks.process_blog_post_update': {'queue': 'blog_posts'},
    'blog.tasks.process_blog_post_deletion': {'queue': 'blog_posts'},
    'blog.tasks.process_content_analysis': {'queue': 'content_analysis'},
    'blog.tasks.send_post_notifications': {'queue': 'notifications'},
}

# Rate limiting for blog tasks
BLOG_TASK_ANNOTATIONS = {
    'blog.tasks.process_blog_post_creation': {'rate_limit': '10/m'},
    'blog.tasks.process_blog_post_update': {'rate_limit': '20/m'},
    'blog.tasks.process_blog_post_deletion': {'rate_limit': '15/m'},
    'blog.tasks.process_content_analysis': {'rate_limit': '5/m'},
    'blog.tasks.send_post_notifications': {'rate_limit': '30/m'},
}

# Retry configuration
BLOG_TASK_RETRY_KWARGS = {
    'max_retries': 3,
    'countdown': 60,
    'retry_backoff': True,
    'retry_backoff_max': 600,
    'retry_jitter': True,
}

def configure_blog_celery(app: Celery):
    """
    Configure Celery app with blog-specific settings.
    """
    # Update task routes
    current_routes = getattr(app.conf, 'task_routes', {})
    current_routes.update(BLOG_TASK_ROUTES)
    app.conf.task_routes = current_routes
    
    # Update task annotations
    current_annotations = getattr(app.conf, 'task_annotations', {})
    current_annotations.update(BLOG_TASK_ANNOTATIONS)
    app.conf.task_annotations = current_annotations
    
    # Set default retry kwargs for blog tasks
    app.conf.task_default_retry_delay = 60
    app.conf.task_max_retries = 3
    
    return app