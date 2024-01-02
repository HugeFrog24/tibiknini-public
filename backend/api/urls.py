from django.contrib.auth import views as auth_views
from django.urls import path, include
from rest_framework.permissions import AllowAny

from core.views import PrivacyPolicyView, TermsOfServiceView
from .views import NavbarItemList, ReCaptchaLoginView, set_csrf_token

app_name = 'api'

urlpatterns = [
    path('navbar/', NavbarItemList.as_view(), name='navbar_api'),
    path('blog/', include('blog.urls')),
    path('messages/', include('messages.urls')),

    path('privacy_policy/', PrivacyPolicyView.as_view(), name='blog_posts_by_user'),
    path('terms_of_service/', TermsOfServiceView.as_view(), name='blog_posts_by_user'),

    path('users/', include('users.urls')),
    path('set-csrf-token/', set_csrf_token, name='set_csrf_token'),
    path('auth/login/', ReCaptchaLoginView.as_view(), name='login'),
    path('auth/logout/', auth_views.LogoutView.as_view(), name='logout'),
]
