from django.urls import path
from .views import (
    PrivacyPolicyView,
    SiteInfoView,
    SiteTitleView,
    TermsOfServiceView,
)

urlpatterns = [
    path("site-info/", SiteInfoView.as_view(), name="site-info"),
    path("site-title/", SiteTitleView.as_view(), name="site-title"),
    path("privacy-policy/", PrivacyPolicyView.as_view(), name="privacy_policy"),
    path(
        "terms-of-service/", TermsOfServiceView.as_view(), name="terms_of_service"
    ),
]
