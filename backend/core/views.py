from rest_framework import generics
from .models import SiteInfo, SiteInfoType
from .serializers import SiteInfoSerializer


class SiteInfoView(generics.RetrieveAPIView):
    queryset = SiteInfo.objects.all()
    serializer_class = SiteInfoSerializer

    def get_object(self):
        return SiteInfo.objects.first()


class PrivacyPolicyView(generics.RetrieveAPIView):
    queryset = SiteInfo.objects.all()
    serializer_class = SiteInfoSerializer

    def get_object(self):
        return SiteInfo.objects.filter(type=SiteInfoType.PRIVACY_POLICY).first()


class TermsOfServiceView(generics.RetrieveAPIView):
    queryset = SiteInfo.objects.all()
    serializer_class = SiteInfoSerializer

    def get_object(self):
        return SiteInfo.objects.filter(type=SiteInfoType.TERMS_OF_SERVICE).first()
