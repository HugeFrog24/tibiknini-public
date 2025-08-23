from django.contrib import admin, messages
from django.contrib.contenttypes.models import ContentType
from django.urls import reverse
from django.utils.html import format_html
from django.utils.safestring import mark_safe

from .models import ContentReport, ModerationAction, ReportReason, UserWarning


@admin.register(ReportReason)
class ReportReasonAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "is_active",
        "created_by",
        "created_at",
        "last_modified_by",
        "last_modified_at",
    )
    list_filter = ("is_active", "created_at", "last_modified_at")
    search_fields = ("name", "description")
    readonly_fields = (
        "created_by",
        "created_at",
        "last_modified_by",
        "last_modified_at",
    )

    def save_model(self, request, obj, form, change):
        if not obj.pk:  # New object
            obj.created_by = request.user
        obj.last_modified_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(UserWarning)
class UserWarningAdmin(admin.ModelAdmin):
    list_display = ("user", "reason", "issued_by", "issued_at", "acknowledged")
    list_filter = ("acknowledged", "issued_at")
    search_fields = ("user__username", "reason")
    raw_id_fields = ("user", "issued_by", "report")
    readonly_fields = ("issued_at",)
    date_hierarchy = "issued_at"


class ModerationActionInline(admin.TabularInline):
    model = ModerationAction
    extra = 0
    readonly_fields = (
        "action_type",
        "performed_by",
        "performed_at",
        "view_state_changes",
    )
    fields = (
        "action_type",
        "performed_by",
        "performed_at",
        "view_state_changes",
        "notes",
    )
    can_delete = False
    max_num = 0

    def view_state_changes(self, obj):
        if not obj.pk:
            return ""

        changes = []
        if obj.previous_state:
            for key, old_value in obj.previous_state.items():
                new_value = obj.new_state.get(key)
                if old_value != new_value:
                    changes.append(f"<strong>{key}</strong>: {old_value} → {new_value}")
        else:
            changes = [f"<strong>{k}</strong>: {v}" for k, v in obj.new_state.items()]

        return mark_safe("<br>".join(changes))

    view_state_changes.short_description = "State Changes"


@admin.register(ContentReport)
class ContentReportAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "reporter",
        "content_link",
        "reason",
        "reported_at",
        "verdict",
        "reviewed_by",
        "action_taken",
    )
    list_filter = ("verdict", "reason", "reviewed_at", "content_type", "action_taken")
    search_fields = ("description", "verdict_note")
    raw_id_fields = ("reporter", "reviewed_by")
    readonly_fields = ("reported_at", "content_link", "action_taken")
    
    def get_fields(self, request, obj=None):
        fields = super().get_fields(request, obj)
        # For new reports, don't show review-related fields
        if not obj or obj.verdict == 'pending':
            # Remove review fields for new/pending reports
            review_fields = ['reviewed_by', 'reviewed_at', 'verdict_note']
            fields = [f for f in fields if f not in review_fields]
        return fields
    
    def get_readonly_fields(self, request, obj=None):
        readonly = list(super().get_readonly_fields(request, obj))
        # Always make these fields readonly
        if obj and obj.reviewed_at:
            readonly.extend(['reviewed_by', 'reviewed_at'])
        return readonly
    date_hierarchy = "reported_at"
    inlines = [ModerationActionInline]
    actions = ["hide_content", "warn_user", "ban_user"]

    def content_link(self, obj):
        try:
            content_obj = obj.content_type.get_object_for_this_type(id=obj.object_id)
            if hasattr(content_obj, "get_absolute_url"):
                url = content_obj.get_absolute_url()
            else:
                # Fallback to admin URL
                url = reverse(
                    f"admin:{content_obj._meta.app_label}_{content_obj._meta.model_name}_change",
                    args=[obj.object_id],
                )
            return format_html('<a href="{}">{}</a>', url, str(content_obj))
        except Exception:
            return f"{obj.content_type} #{obj.object_id} (deleted)"

    content_link.short_description = "Reported Content"

    def hide_content(self, request, queryset):
        for report in queryset:
            try:
                report.take_action(request.user, "hide")
                messages.success(
                    request, f"Successfully hidden content for report #{report.id}"
                )
            except Exception as e:
                messages.error(
                    request, f"Failed to hide content for report #{report.id}: {str(e)}"
                )

    hide_content.short_description = "Hide selected content"

    def warn_user(self, request, queryset):
        for report in queryset:
            try:
                report.take_action(request.user, "warning")
                messages.success(
                    request, f"Successfully issued warning for report #{report.id}"
                )
            except Exception as e:
                messages.error(
                    request,
                    f"Failed to issue warning for report #{report.id}: {str(e)}",
                )

    warn_user.short_description = "Issue warning to content author"

    def ban_user(self, request, queryset):
        for report in queryset:
            try:
                report.take_action(request.user, "ban")
                messages.success(
                    request, f"Successfully banned user for report #{report.id}"
                )
            except Exception as e:
                messages.error(
                    request, f"Failed to ban user for report #{report.id}: {str(e)}"
                )

    ban_user.short_description = "Ban content author"

    def save_model(self, request, obj, form, change):
        creating = not obj.pk
        if creating:
            # Store initial state for audit
            initial_state = {
                "verdict": obj.verdict,
                "description": obj.description,
                "action_taken": obj.action_taken,
            }
        else:
            # Get the original object for comparison
            original = self.model.objects.get(pk=obj.pk)
            initial_state = {
                "verdict": original.verdict,
                "description": original.description,
                "action_taken": original.action_taken,
            }

        # Save the report
        super().save_model(request, obj, form, change)

        # Create audit trail
        new_state = {
            "verdict": obj.verdict,
            "description": obj.description,
            "action_taken": obj.action_taken,
        }

        action_type = "report_created" if creating else "report_reviewed"
        ModerationAction.objects.create(
            action_type=action_type,
            performed_by=request.user,
            report=obj,
            previous_state=None if creating else initial_state,
            new_state=new_state,
            notes=f"{'Created' if creating else 'Updated'} via admin interface",
        )


@admin.register(ModerationAction)
class ModerationActionAdmin(admin.ModelAdmin):
    list_display = (
        "performed_at",
        "action_type",
        "performed_by",
        "get_related_item",
        "notes",
    )
    list_filter = ("action_type", "performed_at", "performed_by")
    search_fields = ("notes", "performed_by__username")
    readonly_fields = (
        "performed_at",
        "performed_by",
        "action_type",
        "report",
        "report_reason",
        "previous_state",
        "new_state",
    )
    date_hierarchy = "performed_at"

    def get_related_item(self, obj):
        if obj.report:
            return f"Report #{obj.report.id}"
        elif obj.report_reason:
            return f"Reason: {obj.report_reason.name}"
        return "-"

    get_related_item.short_description = "Related Item"
