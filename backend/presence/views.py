from django.contrib.auth import get_user_model
from django.shortcuts import render
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import UserPresence
from .serializers import UserPresenceSerializer

User = get_user_model()


class UserPresenceList(generics.ListAPIView):
    serializer_class = UserPresenceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserPresence.objects.select_related("user").all()


class UserPresenceDetail(generics.RetrieveAPIView):
    serializer_class = UserPresenceSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "user__username"
    queryset = UserPresence.objects.select_related("user")
