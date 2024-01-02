from rest_framework import permissions


class IsNotHidden(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return not obj.hidden or request.user == obj.author or request.user.is_staff


class IsAuthorOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return request.user == obj.author or request.user.is_staff
