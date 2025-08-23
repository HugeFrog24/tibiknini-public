import logging
import os
import smtplib
from datetime import datetime
from email.mime.text import MIMEText
from pathlib import Path

from celery import shared_task
from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth import login as auth_login
from django.core.management import call_command
from django.db import OperationalError, connections, transaction
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from dotenv import load_dotenv
from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import SiteInfo, SMTPSettings
from core.tasks import send_scheduled_email
from navbar.models import NavbarItem

from .serializers import NavbarItemSerializer
from .utils import get_setup_status
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
            return JsonResponse({
                "detail": "Successfully logged in.",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "is_staff": user.is_staff,
                    "is_superuser": user.is_superuser,
                },
            })
        else:
            return JsonResponse(
                {"detail": "Invalid login credentials."},
                status=status.HTTP_400_BAD_REQUEST,
            )


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
                {"error": "An internal server error occurred. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
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
                {"error": "An internal server error occurred. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
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
                {"error": "An internal server error occurred. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class SetupEmailView(APIView):
    def post(self, request, *args, **kwargs):
        host = request.data.get("host")
        port = request.data.get("port")
        username = request.data.get("username")
        password = request.data.get("password")
        use_tls = request.data.get("use_tls", True)
        from_email = request.data.get("from_email")

        if not all([host, port, username, password, from_email]):
            return JsonResponse(
                {"detail": "All SMTP fields are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Test SMTP connection
            server = smtplib.SMTP(host, int(port))
            if use_tls:
                server.starttls()
            server.login(username, password)

            # Send test email
            msg = MIMEText("This is a test email from your application setup.")
            msg["Subject"] = "Test Email"
            msg["From"] = from_email
            msg["To"] = from_email
            server.send_message(msg)
            server.quit()

            # Save settings
            smtp_settings = SMTPSettings.objects.first()
            if not smtp_settings:
                smtp_settings = SMTPSettings()

            smtp_settings.host = host
            smtp_settings.port = port
            smtp_settings.username = username
            smtp_settings.password = password
            smtp_settings.use_tls = use_tls
            smtp_settings.from_email = from_email
            smtp_settings.save()

            setup_status = get_setup_status()
            return JsonResponse(
                {"detail": "Email configuration successful!", **setup_status},
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            logging.error(f"Error during email setup: {str(e)}", exc_info=True)
            return JsonResponse(
                {"detail": "Failed to configure email settings. Please check your configuration."},
                status=status.HTTP_400_BAD_REQUEST,
            )


@api_view(["POST"])
def send_test_email(request):
    """Send a test email using the current SMTP configuration"""
    try:
        recipient = request.data.get("email")
        if not recipient:
            return Response({"detail": "Email address is required"}, status=400)

        send_scheduled_email.delay(
            subject="Test Email from Your Application",
            recipient_list=[recipient],
            template_name="email/test_email.html",
            context={
                "recipient": recipient,
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            },
        )
        return Response({"detail": "Test email has been queued"}, status=200)
    except Exception as e:
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to send test email: {str(e)}")
        return Response(
            {"detail": "Failed to send test email. Please check your email configuration."}, 
            status=500
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
