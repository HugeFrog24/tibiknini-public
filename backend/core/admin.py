from django.contrib import admin
from .models import SiteInfo


@admin.register(SiteInfo)
class SiteInfoAdmin(admin.ModelAdmin):
    list_display = ('site_title', 'site_description', 'type', 'content', 'tos_version')
