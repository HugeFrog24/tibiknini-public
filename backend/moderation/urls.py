from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReportReasonViewSet, ContentReportViewSet

router = DefaultRouter()
router.register(r'reasons', ReportReasonViewSet)
router.register(r'reports', ContentReportViewSet, basename='report')

urlpatterns = [
    path('', include(router.urls)),
]
