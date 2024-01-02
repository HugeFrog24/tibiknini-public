from rest_framework import serializers
from navbar.models import NavbarItem


class NavbarItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = NavbarItem
        fields = ['label', 'destination_url']
