from django.http import JsonResponse
from api.views import get_setup_status

class SetupMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Exclude specific paths from the setup check
        if (request.path.startswith('/api/setup') or 
            request.path.startswith('/api/create-superuser') or 
            request.path.startswith('/static') or 
            request.path.startswith('/django-static')):
            return self.get_response(request)

        setup_status = get_setup_status()
        if not all(setup_status.values()):
            return JsonResponse({'detail': 'Setup required'}, status=503)

        return self.get_response(request)
