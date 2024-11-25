from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ContentReportViewSet, ReportReasonViewSet

router = DefaultRouter()
router.register(r"reasons", ReportReasonViewSet)
router.register(r"reports", ContentReportViewSet, basename="report")

urlpatterns = [
    path("", include(router.urls)),
]
