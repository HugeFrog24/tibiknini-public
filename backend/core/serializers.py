from rest_framework import serializers
from .models import SiteInfo


class SiteInfoSerializer(serializers.ModelSerializer):
    content = serializers.SerializerMethodField()
    type = serializers.SerializerMethodField()

    class Meta:
        model = SiteInfo
        fields = ['type', 'site_title', 'site_description', 'content', 'tos_version', 'last_updated']

    def get_type(self, obj):
        return obj.get_type_display()

    def get_content(self, obj):
        site_title = obj.site_title
        return self.replace_site_name(obj.content, site_title)

    @staticmethod
    def replace_site_name(text, site_name):
        return text.replace('{SITE_NAME}', site_name)
