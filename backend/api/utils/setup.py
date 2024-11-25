import os
from pathlib import Path

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import OperationalError, connections
from dotenv import load_dotenv

from core.models import SiteInfo, SMTPSettings


def get_setup_status():
    env_path = Path(settings.BASE_DIR) / ".env"
    database_configured = False
    superuser_exists = False
    site_title_set = False
    email_configured = False

    if env_path.exists():
        load_dotenv(env_path)
        required_settings = [
            "POSTGRES_DB",
            "POSTGRES_USER",
            "POSTGRES_PASSWORD",
            "POSTGRES_HOST",
            "POSTGRES_PORT",
        ]
        database_configured = all(os.getenv(setting) for setting in required_settings)

    try:
        connections["default"].cursor()
        if database_configured:
            superuser_exists = (
                get_user_model().objects.filter(is_superuser=True).exists()
            )
            site_info = SiteInfo.objects.first()
            site_title_set = bool(site_info and site_info.site_title)
            smtp_settings = SMTPSettings.objects.first()
            email_configured = bool(
                smtp_settings
                and all(
                    [
                        smtp_settings.host,
                        smtp_settings.port,
                        smtp_settings.username,
                        smtp_settings.password,
                        smtp_settings.from_email,
                    ]
                )
            )
    except OperationalError:
        pass

    return {
        "database_configured": database_configured,
        "superuser_exists": superuser_exists,
        "site_title_set": site_title_set,
        "email_configured": email_configured,
    }
