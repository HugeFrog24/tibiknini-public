"""
Celery configuration for moderation tasks.
This file defines periodic tasks and task routing for the moderation system.
"""

from celery.schedules import crontab

# Celery beat schedule for periodic tasks
CELERY_BEAT_SCHEDULE = {
    # Clean up old moderation actions every week
    'cleanup-old-moderation-actions': {
        'task': 'moderation.tasks.cleanup_old_moderation_actions',
        'schedule': crontab(hour=2, minute=0, day_of_week=0),  # Every Sunday at 2 AM
        'kwargs': {'days_old': 90},  # Keep 90 days of history
    },
    
    # Generate moderation report every day
    'generate-daily-moderation-report': {
        'task': 'moderation.tasks.generate_moderation_report',
        'schedule': crontab(hour=1, minute=0),  # Every day at 1 AM
    },
}

# Task routing configuration
CELERY_TASK_ROUTES = {
    # High priority queue for moderation reviews
    'moderation.tasks.process_moderation_review': {
        'queue': 'moderation_high',
        'routing_key': 'moderation.high',
    },
    
    # Low priority queue for cleanup tasks
    'moderation.tasks.cleanup_old_moderation_actions': {
        'queue': 'moderation_low',
        'routing_key': 'moderation.low',
    },
    
    # Medium priority for reports
    'moderation.tasks.generate_moderation_report': {
        'queue': 'moderation_medium',
        'routing_key': 'moderation.medium',
    },
}

# Task configuration
CELERY_TASK_ANNOTATIONS = {
    'moderation.tasks.process_moderation_review': {
        'rate_limit': '100/m',  # Max 100 reviews per minute
        'time_limit': 300,      # 5 minute timeout
        'soft_time_limit': 240, # 4 minute soft timeout
    },
    'moderation.tasks.cleanup_old_moderation_actions': {
        'rate_limit': '1/h',    # Max once per hour
        'time_limit': 3600,     # 1 hour timeout
    },
    'moderation.tasks.generate_moderation_report': {
        'rate_limit': '10/h',   # Max 10 reports per hour
        'time_limit': 600,      # 10 minute timeout
    },
}