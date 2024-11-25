from rest_framework import serializers

from .models import UserPresence


class UserPresenceSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = UserPresence
        fields = ["user", "username", "is_online", "last_seen"]
        read_only_fields = ["user", "username", "is_online", "last_seen"]
