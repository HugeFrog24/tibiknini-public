from rest_framework import serializers
from .models import ContactMessage


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ['subject', 'message', 'name', 'email', 'ip_address', 'status', 'created_at', 'updated_at']
