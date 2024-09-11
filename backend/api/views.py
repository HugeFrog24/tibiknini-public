import json
import logging
from pathlib import Path
from django.contrib.auth import authenticate
from django.contrib.auth import login as auth_login
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import generics, status
from rest_framework.views import APIView

from core.models import SiteInfo
from navbar.models import NavbarItem

from .serializers import NavbarItemSerializer
from .utils.recaptcha import verify_recaptcha

import os
from django.conf import settings
from django.core.management import call_command
from django.contrib.auth import get_user_model
from django.db import transaction

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
        username = request.data.get('username')
        password = request.data.get('password')
        recaptcha_token = request.data.get('recaptcha')

        is_valid, response = verify_recaptcha(recaptcha_token)
        if not is_valid:
            return response

        user = authenticate(request, username=username, password=password)

        if user is not None:
            auth_login(request, user)
            return JsonResponse({'detail': 'Successfully logged in.'})
        else:
            return JsonResponse({'detail': 'Invalid login credentials.'}, status=status.HTTP_400_BAD_REQUEST)

def get_setup_status():
    env_path = Path(settings.BASE_DIR) / '.env'
    database_configured = False
    superuser_exists = False
    site_title_set = False

    # Check if the database is configured
    if env_path.exists():
        with env_path.open('r') as f:
            for line in f:
                if line.startswith('DATABASE_URL='):
                    database_configured = True
                    break

    if database_configured:
        # Check if a superuser exists
        superuser_exists = User.objects.filter(is_superuser=True).exists()

        # Check if the site title is set in the database
        site_info = SiteInfo.objects.first()
        site_title_set = bool(site_info and site_info.site_title)

    return {
        'database_configured': database_configured,
        'superuser_exists': superuser_exists,
        'site_title_set': site_title_set
    }

class SetupView(APIView):
    def post(self, request, *args, **kwargs):
        db_host = request.data.get('db_host')
        db_port = request.data.get('db_port')
        db_name = request.data.get('db_name')
        db_user = request.data.get('db_user')
        db_password = request.data.get('db_password')

        # Write database settings to .env file
        env_path = Path(settings.BASE_DIR) / '.env'
        if not env_path.exists():
            env_path.touch()

        with env_path.open('r') as f:
            lines = f.readlines()
        
        # Update or add the DATABASE_URL line
        updated_lines = []
        db_url_written = False
        for line in lines:
            if line.startswith('DATABASE_URL='):
                line = f'DATABASE_URL=postgres://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}\n'
                db_url_written = True
            updated_lines.append(line)
        
        if not db_url_written:
            updated_lines.append(f'DATABASE_URL=postgres://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}\n')

        with env_path.open('w') as f:
            f.writelines(updated_lines)

        try:
            # Run migrations
            call_command('migrate')
            
            setup_status = get_setup_status()
            
            return JsonResponse({
                'detail': 'Database setup complete',
                **setup_status
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logging.error(f"Error during database setup: {str(e)}", exc_info=True)
            return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SetupSiteInfoView(APIView):
    def post(self, request, *args, **kwargs):
        site_title = request.data.get('site_title')

        try:
            # Load the site_info fixture
            call_command('loaddata', 'core/fixtures/site_info.json')

            # Update the site_title in the database
            site_info = SiteInfo.objects.first()
            if site_info:
                site_info.site_title = site_title
                site_info.save()
            
            setup_status = get_setup_status()
            
            return JsonResponse({
                'detail': 'Site info setup complete',
                **setup_status
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logging.error(f"Error during site info setup: {str(e)}", exc_info=True)
            return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CreateSuperUserView(APIView):
    def post(self, request, *args, **kwargs):
        admin_username = request.data.get('admin_username')
        admin_email = request.data.get('admin_email')
        admin_password = request.data.get('admin_password')

        try:
            with transaction.atomic():
                if not User.objects.filter(is_superuser=True).exists():
                    User.objects.create_superuser(
                        username=admin_username,
                        email=admin_email,
                        password=admin_password
                    )
                    
                    setup_status = get_setup_status()
                    
                    return JsonResponse({
                        'detail': 'Superuser created successfully',
                        **setup_status
                    }, status=status.HTTP_201_CREATED)
                else:
                    setup_status = get_setup_status()
                    
                    return JsonResponse({
                        'detail': 'Superuser already exists',
                        **setup_status
                    }, status=status.HTTP_200_OK)
        except Exception as e:
            logging.error(f"Error during superuser creation: {str(e)}", exc_info=True)
            return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SetupStatusView(APIView):
    def get(self, request):
        env_path = Path(settings.BASE_DIR) / '.env'
        database_configured = False
        superuser_exists = None  # Use None to indicate uncertainty
        site_title_set = None

        # Check if the database is configured
        if env_path.exists():
            with env_path.open('r') as f:
                for line in f:
                    if line.startswith('DATABASE_URL='):
                        database_configured = True
                        break

        if database_configured:
            # Check if a superuser exists
            try:
                superuser_exists = User.objects.filter(is_superuser=True).exists()
            except Exception as e:
                logging.error(f"Error checking for superuser: {str(e)}", exc_info=True)
                superuser_exists = None  # Indicate that the check failed

            # Check if the site title is set in the database
            try:
                site_info = SiteInfo.objects.first()
                if site_info and site_info.site_title.strip():
                    site_title_set = True
            except SiteInfo.DoesNotExist:
                site_title_set = False
            except Exception as e:
                logging.error(f"Error retrieving site title: {str(e)}", exc_info=True)

        # Determine overall status
        if database_configured and superuser_exists and site_title_set:
            overall_status = 'complete'
            status_code = status.HTTP_200_OK
        else:
            overall_status = 'incomplete'
            status_code = status.HTTP_503_SERVICE_UNAVAILABLE

        # Return the detailed setup status
        return JsonResponse({
            'database_configured': database_configured,
            'superuser_exists': superuser_exists,
            'site_title_set': site_title_set,
            'status': overall_status
        }, status=status_code)
