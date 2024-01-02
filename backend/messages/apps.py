from django.apps import AppConfig


class MessagesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'messages'
    label = 'site_messages'

    def ready(self):
        import messages.signals  # noqa
