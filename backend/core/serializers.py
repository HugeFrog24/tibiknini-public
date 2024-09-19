from rest_framework import serializers

from .models import PrivacyPolicy, SiteInfo, TermsOfService


class SiteInfoSerializer(serializers.ModelSerializer):
    site_name = serializers.SerializerMethodField()

    class Meta:
        model = SiteInfo
        fields = ["site_name", "site_description", "last_updated"]

    def get_site_name(self, obj):
        return obj.site_title


class PrivacyPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = PrivacyPolicy
        fields = ["content", "version", "last_updated", "title"]


class TermsOfServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = TermsOfService
        fields = ["content", "version", "last_updated", "title"]
