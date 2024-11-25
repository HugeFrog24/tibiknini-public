import logging
import os
from pathlib import Path

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth import login as auth_login
from django.core.management import call_command
from django.db import connections, transaction
from django.db.utils import OperationalError
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from dotenv import load_dotenv
from rest_framework import generics, status
from rest_framework.views import APIView

from core.models import SiteInfo
from navbar.models import NavbarItem

from .serializers import NavbarItemSerializer
from .utils.recaptcha import verify_recaptcha

User = get_user_model()


@ensure_csrf_cookie
def set_csrf_token(request):
    """
    This view sets the CSRF cookie on the client.
    """
    return HttpResponse(status=200)


class NavbarItemList(generics.ListAPIView):
    queryset = NavbarItem.objects.all()
    serializer_class = NavbarItemSerializer


class ReCaptchaLoginView(APIView):
    def post(self, request, *args, **kwargs):
        username = request.data.get("username")
        password = request.data.get("password")
        recaptcha_token = request.data.get("recaptcha")

        is_valid, response = verify_recaptcha(recaptcha_token)
        if not is_valid:
            return response

        user = authenticate(request, username=username, password=password)

        if user is not None:
            auth_login(request, user)
            return JsonResponse({"detail": "Successfully logged in."})
        else:
            return JsonResponse(
                {"detail": "Invalid login credentials."},
                status=status.HTTP_400_BAD_REQUEST,
            )


def get_setup_status():
    env_path = Path(settings.BASE_DIR) / ".env"
    database_configured = False
    superuser_exists = False
    site_title_set = False

    if env_path.exists():
        load_dotenv(env_path)
        required_settings = [
            "POSTGRES_DB",
            "POSTGRES_USER",
            "POSTGRES_PASSWORD",
            "POSTGRES_HOST",
            "POSTGRES_PORT",
        ]
        if all(os.getenv(setting) for setting in required_settings):
            try:
                connection = connections["default"]
                connection.ensure_connection()
                database_configured = True
            except OperationalError:
                database_configured = False

    if database_configured:
        # Check if a superuser exists
        superuser_exists = User.objects.filter(is_superuser=True).exists()

        # Check if the site title is set in the database
        site_info = SiteInfo.objects.first()
        site_title_set = bool(site_info and site_info.site_title)

    return {
        "database_configured": database_configured,
        "superuser_exists": superuser_exists,
        "site_title_set": site_title_set,
    }


class SetupView(APIView):
    @transaction.non_atomic_requests
    def post(self, request, *args, **kwargs):
        db_host = request.data.get("db_host")
        db_port = request.data.get("db_port")
        db_name = request.data.get("db_name")
        db_user = request.data.get("db_user")
        db_password = request.data.get("db_password")

        # Write database settings to .env file
        env_path = Path(settings.BASE_DIR) / ".env"
        if not env_path.exists():
            env_path.touch()

        db_settings = {
            "POSTGRES_HOST": db_host,
            "POSTGRES_PORT": db_port,
            "POSTGRES_DB": db_name,
            "POSTGRES_USER": db_user,
            "POSTGRES_PASSWORD": db_password,
        }

        with env_path.open("r") as f:
            lines = f.readlines()

        updated_lines = []
        for line in lines:
            key = line.split("=")[0] if "=" in line else None
            if key in db_settings:
                updated_lines.append(f"{key}={db_settings[key]}\n")
                del db_settings[key]
            else:
                updated_lines.append(line)

        # Add any remaining new settings
        for key, value in db_settings.items():
            updated_lines.append(f"{key}={value}\n")

        with env_path.open("w") as f:
            f.writelines(updated_lines)

        try:
            # Reload database settings
            load_dotenv(env_path)

            # Update Django's database configuration
            settings.DATABASES["default"] = {
                "ENGINE": "django.db.backends.postgresql",
                "NAME": os.getenv("POSTGRES_DB"),
                "USER": os.getenv("POSTGRES_USER"),
                "PASSWORD": os.getenv("POSTGRES_PASSWORD"),
                "HOST": os.getenv("POSTGRES_HOST"),
                "PORT": os.getenv("POSTGRES_PORT"),
                "ATOMIC_REQUESTS": False,  # Disable atomic requests for setup
            }

            # Run migrations
            call_command("migrate")

            # Initialize default report reasons
            call_command("init_report_reasons")

            setup_status = get_setup_status()

            return JsonResponse(
                {"detail": "Database setup complete", **setup_status},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            logging.error(f"Error during database setup: {str(e)}", exc_info=True)
            return JsonResponse(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SetupSiteInfoView(APIView):
    def post(self, request, *args, **kwargs):
        site_title = request.data.get("site_title")

        try:
            # Run the custom load_site_info management command
            call_command("load_site_info")

            # Update the site_title in the database
            site_info = SiteInfo.objects.first()
            if site_info:
                site_info.site_title = site_title
                site_info.save()

            setup_status = get_setup_status()

            return JsonResponse(
                {"detail": "Site info setup complete", **setup_status},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            logging.error(f"Error during site info setup: {str(e)}", exc_info=True)
            return JsonResponse(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CreateSuperUserView(APIView):
    def post(self, request, *args, **kwargs):
        admin_username = request.data.get("admin_username")
        admin_email = request.data.get("admin_email")
        admin_password = request.data.get("admin_password")

        try:
            with transaction.atomic():
                if not User.objects.filter(is_superuser=True).exists():
                    User.objects.create_superuser(
                        username=admin_username,
                        email=admin_email,
                        password=admin_password,
                    )

                    setup_status = get_setup_status()

                    return JsonResponse(
                        {"detail": "Superuser created successfully", **setup_status},
                        status=status.HTTP_201_CREATED,
                    )
                else:
                    setup_status = get_setup_status()

                    return JsonResponse(
                        {"detail": "Superuser already exists", **setup_status},
                        status=status.HTTP_200_OK,
                    )
        except Exception as e:
            logging.error(f"Error during superuser creation: {str(e)}", exc_info=True)
            return JsonResponse(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SetupStatusView(APIView):
    def get(self, request):
        setup_status = get_setup_status()
        overall_status = "complete" if all(setup_status.values()) else "incomplete"
        status_code = (
            status.HTTP_200_OK
            if overall_status == "complete"
            else status.HTTP_503_SERVICE_UNAVAILABLE
        )

        return JsonResponse(
            {**setup_status, "status": overall_status}, status=status_code
        )
