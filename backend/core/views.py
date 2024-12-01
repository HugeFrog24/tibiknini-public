from rest_framework import generics
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly

from .models import PrivacyPolicy, SiteInfo, TermsOfService
from .serializers import (
    PrivacyPolicySerializer,
    SiteInfoSerializer,
    SiteTitleSerializer,
    TermsOfServiceSerializer,
)


class SiteInfoView(generics.RetrieveUpdateAPIView):
    queryset = SiteInfo.objects.all()
    serializer_class = SiteInfoSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return SiteInfo.objects.first()

    def put(self, request, *args, **kwargs):
        if not request.user.is_superuser:
            return Response(
                {"error": "Only superusers can modify site settings"}, status=403
            )
        return super().put(request, *args, **kwargs)


class SiteTitleView(generics.RetrieveUpdateAPIView):
    queryset = SiteInfo.objects.all()
    serializer_class = SiteTitleSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_object(self):
        return SiteInfo.objects.first()

    def put(self, request, *args, **kwargs):
        if not request.user.is_superuser:
            return Response(
                {"error": "Only superusers can modify site settings"}, status=403
            )
        site_info = self.get_object()
        site_info.site_title = request.data.get('site_name')
        site_info.save()
        return Response(self.get_serializer(site_info).data)


class PrivacyPolicyView(generics.RetrieveAPIView):
    queryset = PrivacyPolicy.objects.all()
    serializer_class = PrivacyPolicySerializer

    def get_object(self):
        privacy_policy = PrivacyPolicy.objects.first()
        privacy_policy.content = privacy_policy.get_content()
        return privacy_policy


class TermsOfServiceView(generics.RetrieveAPIView):
    queryset = TermsOfService.objects.all()
    serializer_class = TermsOfServiceSerializer

    def get_object(self):
        terms_of_service = TermsOfService.objects.first()
        terms_of_service.content = terms_of_service.get_content()
        return terms_of_service
