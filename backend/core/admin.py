from django.contrib import admin

from .models import PrivacyPolicy, SiteInfo, TermsOfService


@admin.register(SiteInfo)
class SiteInfoAdmin(admin.ModelAdmin):
    list_display = ("site_title", "site_description", "last_updated")
    fields = ("site_title", "site_description")


@admin.register(PrivacyPolicy)
class PrivacyPolicyAdmin(admin.ModelAdmin):
    list_display = ("title", "version", "last_updated")
    fields = ("title", "content", "version")


@admin.register(TermsOfService)
class TermsOfServiceAdmin(admin.ModelAdmin):
    list_display = ("title", "version", "last_updated")
    fields = ("title", "content", "version")
