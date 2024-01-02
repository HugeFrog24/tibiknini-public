from django.contrib.auth import authenticate, login as auth_login
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import ensure_csrf_cookie

from navbar.models import NavbarItem

from rest_framework import generics, status
from rest_framework.views import APIView

from .serializers import NavbarItemSerializer
from .utils.recaptcha import verify_recaptcha

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
        