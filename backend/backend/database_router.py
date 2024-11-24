import os

from django.conf import settings
from dotenv import load_dotenv


class DynamicDatabaseRouter:
    def __init__(self):
        self.load_database_settings()

    def load_database_settings(self):
        load_dotenv()
        settings.DATABASES["default"] = self.get_database_config()

    def get_database_config(self):
        return {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv("POSTGRES_DB"),
            "USER": os.getenv("POSTGRES_USER"),
            "PASSWORD": os.getenv("POSTGRES_PASSWORD"),
            "HOST": os.getenv("POSTGRES_HOST"),
            "PORT": os.getenv("POSTGRES_PORT"),
            "ATOMIC_REQUESTS": True,
            "TIME_ZONE": "UTC",
            "CONN_HEALTH_CHECKS": True,
            "CONN_MAX_AGE": None,
            "OPTIONS": {},
            "AUTOCOMMIT": True,
        }

    def db_for_read(self, model, **hints):
        return "default"

    def db_for_write(self, model, **hints):
        return "default"

    def allow_relation(self, obj1, obj2, **hints):
        return True

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        return True
