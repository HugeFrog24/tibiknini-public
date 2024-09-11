from rest_framework import generics

from .models import SiteInfo, PrivacyPolicy, TermsOfService
from .serializers import SiteInfoSerializer, PrivacyPolicySerializer, TermsOfServiceSerializer


class SiteInfoView(generics.RetrieveAPIView):
    queryset = SiteInfo.objects.all()
    serializer_class = SiteInfoSerializer

    def get_object(self):
        return SiteInfo.objects.first()


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
