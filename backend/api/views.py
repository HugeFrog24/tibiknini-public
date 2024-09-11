from pathlib import Path
from django.contrib.auth import authenticate
from django.contrib.auth import login as auth_login
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import generics, status
from rest_framework.views import APIView

from navbar.models import NavbarItem

from .serializers import NavbarItemSerializer
from .utils.recaptcha import verify_recaptcha

import os
from django.conf import settings
from django.core.management import call_command
from django.contrib.auth import get_user_model
from django.db import transaction
from users.models import Profile  # Import the Profile model
from users.managers import CustomUserManager  # Import the custom manager

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

class SetupView(APIView):
    def post(self, request, *args, **kwargs):
        db_host = request.data.get('db_host')
        db_port = request.data.get('db_port')
        db_name = request.data.get('db_name')
        db_user = request.data.get('db_user')
        db_password = request.data.get('db_password')
        admin_username = request.data.get('admin_username')
        admin_email = request.data.get('admin_email')
        admin_password = request.data.get('admin_password')

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

            with transaction.atomic():
                # Use the custom manager to create the superuser
                User.objects.create_superuser(
                    username=admin_username,
                    email=admin_email,
                    password=admin_password
                )

            return JsonResponse({'detail': 'Setup complete'}, status=status.HTTP_200_OK)

        except Exception as e:
            # Log the full error for debugging
            import logging
            logging.error(f"Error during setup: {str(e)}", exc_info=True)

            return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SetupStatusView(APIView):
    def get(self, request):
        env_path = os.path.join(settings.BASE_DIR, '.env')
        if os.path.exists(env_path):
            with open(env_path, 'r') as f:
                for line in f:
                    if line.startswith('DATABASE_URL='):
                        return JsonResponse({'status': 'complete'})
        return JsonResponse({'status': 'incomplete'}, status=503)
