from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import ContactMessageSerializer
from .throttle_classes import ContactMessageThrottle


class ContactMessageView(APIView):
    throttle_classes = [ContactMessageThrottle]

    def post(self, request, format=None):
        data = request.data.copy()  # Make a mutable copy of the data
        data['ip_address'] = request.META.get('REMOTE_ADDR')  # Get the client IP address
        serializer = ContactMessageSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
