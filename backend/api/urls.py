from django.contrib.auth import views as auth_views
from django.urls import include, path

from core.views import PrivacyPolicyView, TermsOfServiceView

from .views import (
    CreateSuperUserView,
    NavbarItemList,
    ReCaptchaLoginView,
    SetupEmailView,
    SetupSiteInfoView,
    SetupStatusView,
    SetupView,
    send_test_email,
    set_csrf_token,
)

app_name = "api"

urlpatterns = [
    path("navbar/", NavbarItemList.as_view(), name="navbar_api"),
    path("blog/", include("blog.urls")),
    path("messages/", include("messages.urls")),
    path("moderation/", include("moderation.urls")),
    path("core/", include("core.urls")),
    path("privacy_policy/", PrivacyPolicyView.as_view(), name="privacy_policy"),
    path("terms_of_service/", TermsOfServiceView.as_view(), name="terms_of_service"),
    path("users/", include("users.urls")),
    path("presence/", include("presence.urls")),
    path("set-csrf-token/", set_csrf_token, name="set_csrf_token"),
    path("auth/login/", ReCaptchaLoginView.as_view(), name="login"),
    path("auth/logout/", auth_views.LogoutView.as_view(), name="logout"),
    path("setup/", SetupView.as_view(), name="setup"),
    path("setup/status/", SetupStatusView.as_view(), name="setup_status"),
    path("setup/site-info/", SetupSiteInfoView.as_view(), name="setup_site_info"),
    path("setup/email/", SetupEmailView.as_view(), name="setup_email"),
    path("setup/test-email/", send_test_email, name="test_email"),
    path("create-superuser/", CreateSuperUserView.as_view(), name="create_superuser"),
]
