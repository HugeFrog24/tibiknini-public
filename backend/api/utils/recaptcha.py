import requests
from django.conf import settings
from django.http import JsonResponse
from rest_framework import status
from rest_framework.response import Response


def verify_recaptcha(recaptcha_token):
    """
    Verifies the reCAPTCHA token with Google.
    Returns a tuple (success, response).
    """
    if not recaptcha_token:
        return False, JsonResponse({"recaptcha": ["This field is required."]}, status=400)

    recaptcha_response = requests.post(
        'https://www.google.com/recaptcha/api/siteverify',
        data={
            'secret': settings.RECAPTCHA_SECRET_KEY,
            'response': recaptcha_token
        },
        timeout=5  # security: timeout request after given seconds
    ).json()

    if not recaptcha_response.get('success'):
        return False, JsonResponse({"recaptcha": ["reCAPTCHA verification failed."]}, status=400)

    return True, None
