import os
from django.http import JsonResponse
from django.conf import settings

class SetupMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Exclude specific paths from the setup check
        if (request.path.startswith('/api/setup') or 
            request.path.startswith('/static') or 
            request.path.startswith('/django-static')):
            return self.get_response(request)

        env_path = os.path.join(settings.BASE_DIR, '.env')
        if not os.path.exists(env_path):
            return JsonResponse({'detail': 'Setup required'}, status=503)

        with open(env_path, 'r') as f:
            for line in f:
                if line.startswith('DATABASE_URL='):
                    return self.get_response(request)

        return JsonResponse({'detail': 'Setup required'}, status=503)