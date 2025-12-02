from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe

from .models import Notification, NotificationPreference


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = [
        'title', 
        'recipient_link', 
        'actor_link', 
        'notification_type', 
        'is_read', 
        'created_at',
        'email_sent'
    ]
    list_filter = [
        'notification_type', 
        'is_read', 
        'email_sent', 
        'created_at'
    ]
    search_fields = [
        'title', 
        'message', 
        'recipient__username', 
        'actor__username'
    ]
    readonly_fields = [
        'created_at', 
        'read_at', 
        'content_object_link'
    ]
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('recipient', 'actor', 'notification_type', 'title', 'message')
        }),
        ('Content Reference', {
            'fields': ('content_type', 'object_id', 'content_object_link'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_read', 'read_at', 'email_sent', 'push_sent')
        }),
        ('Metadata', {
            'fields': ('extra_data', 'created_at'),
            'classes': ('collapse',)
        }),
    )
    
    def recipient_link(self, obj):
        if obj.recipient:
            url = reverse('admin:users_customuser_change', args=[obj.recipient.pk])
            return format_html('<a href="{}">{}</a>', url, obj.recipient.username)
        return '-'
    recipient_link.short_description = 'Recipient'
    
    def actor_link(self, obj):
        if obj.actor:
            url = reverse('admin:users_customuser_change', args=[obj.actor.pk])
            return format_html('<a href="{}">{}</a>', url, obj.actor.username)
        return 'System'
    actor_link.short_description = 'Actor'
    
    def content_object_link(self, obj):
        if obj.content_object:
            content_type = obj.content_type
            model_name = content_type.model
            app_label = content_type.app_label
            
            try:
                url = reverse(f'admin:{app_label}_{model_name}_change', args=[obj.object_id])
                return format_html('<a href="{}">{} #{}</a>', url, content_type.name, obj.object_id)
            except:
                return f'{content_type.name} #{obj.object_id}'
        return '-'
    content_object_link.short_description = 'Related Object'
    
    actions = ['mark_as_read', 'mark_as_unread', 'resend_email']
    
    def mark_as_read(self, request, queryset):
        updated = queryset.filter(is_read=False).update(is_read=True)
        self.message_user(request, f'{updated} notifications marked as read.')
    mark_as_read.short_description = 'Mark selected notifications as read'
    
    def mark_as_unread(self, request, queryset):
        updated = queryset.filter(is_read=True).update(is_read=False, read_at=None)
        self.message_user(request, f'{updated} notifications marked as unread.')
    mark_as_unread.short_description = 'Mark selected notifications as unread'
    
    def resend_email(self, request, queryset):
        from .tasks import send_notification_email
        count = 0
        for notification in queryset:
            if notification.recipient.email:
                send_notification_email.delay(notification.id)
                count += 1
        self.message_user(request, f'Email resend queued for {count} notifications.')
    resend_email.short_description = 'Resend email for selected notifications'


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = [
        'user_link',
        'email_comments',
        'email_follows', 
        'email_likes',
        'email_system',
        'digest_frequency',
        'updated_at'
    ]
    list_filter = [
        'email_comments',
        'email_follows',
        'email_likes', 
        'email_system',
        'digest_frequency',
        'updated_at'
    ]
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Email Preferences', {
            'fields': (
                'email_comments',
                'email_follows', 
                'email_likes',
                'email_system',
                'email_digest'
            )
        }),
        ('In-App Preferences', {
            'fields': (
                'inapp_comments',
                'inapp_follows',
                'inapp_likes', 
                'inapp_system'
            )
        }),
        ('Push Preferences (Future)', {
            'fields': (
                'push_comments',
                'push_follows',
                'push_likes',
                'push_system'
            ),
            'classes': ('collapse',)
        }),
        ('Digest Settings', {
            'fields': ('digest_frequency',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def user_link(self, obj):
        if obj.user:
            url = reverse('admin:users_customuser_change', args=[obj.user.pk])
            return format_html('<a href="{}">{}</a>', url, obj.user.username)
        return '-'
    user_link.short_description = 'User'
