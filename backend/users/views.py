from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.http import JsonResponse

from rest_framework import generics, parsers, status
from rest_framework.decorators import parser_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CustomUser, Follow
from .serializers import (FollowSerializer, ProfileBioSerializer,
                          ProfileImageSerializer, ProfileSerializer,
                          UserRegistrationSerializer)
from .utils import process_profile_image
from api.utils.recaptcha import verify_recaptcha
from .validators import (validate_reserved_username,
                         validate_unique_username,
                         username_validator)

User = get_user_model()


class ProfileListView(generics.ListAPIView):
    queryset = CustomUser.objects.select_related('profile').all()
    serializer_class = ProfileSerializer


class ProfileDetailView(generics.RetrieveAPIView):
    queryset = CustomUser.objects.select_related('profile').all()
    serializer_class = ProfileSerializer
    lookup_field = 'username'


class CheckUsernameView(APIView):
    def get(self, request, username, format=None):
        data = {'username': username}
        try:
            validate_unique_username(username)
            username_validator(username)
            validate_reserved_username(username)
            data['status'] = 'ok'
            return JsonResponse(data, status=status.HTTP_200_OK)
        except ValidationError as e:
            if 'already taken' in str(e):
                data['status'] = 'taken'
                return JsonResponse(data, status=status.HTTP_409_CONFLICT)
            elif 'reserved' in str(e):
                data['status'] = 'reserved'
                return JsonResponse(data, status=status.HTTP_403_FORBIDDEN)
            else:
                data['status'] = 'error'
                data['message'] = str(e)
                return JsonResponse(data, status=status.HTTP_400_BAD_REQUEST)


class CurrentUserView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ProfileSerializer

    def get_object(self):
        return self.request.user


class UserBioRetrieveUpdateView(generics.RetrieveUpdateAPIView):
    """
    Retrieve or update the bio of the specified user.
    """
    queryset = CustomUser.objects.select_related('profile').all()
    serializer_class = ProfileBioSerializer
    lookup_field = 'username'

    def get_object(self):
        if self.kwargs[self.lookup_field] == "me":
            return self.request.user.profile
        return super().get_object().profile


@parser_classes([parsers.MultiPartParser])
class ProfileImageUpdateView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ProfileSerializer
    lookup_field = "username"

    def update(self, request, *args, **kwargs):
        profile = request.user.profile
        image = request.FILES.get("image")
        if not image:
            return Response(status=status.HTTP_400_BAD_REQUEST)

        profile.image.save(image.name, image)
        process_profile_image(profile.image.path)

        serializer = ProfileImageSerializer(profile)  # Add this line
        return Response(serializer.data, status=status.HTTP_200_OK)  # Add this line


class ProfileImageDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        request.user.profile.delete_image()
        return Response(status=status.HTTP_204_NO_CONTENT)


class FollowView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = FollowSerializer
    lookup_url_kwarg = "follower_username"
    lookup_url_kwarg2 = "following_username"

    def get_object(self, follower_username, following_username):
        queryset = Follow.objects.all()
        filter_kwargs = {
            'follower__username': follower_username,
            'following__username': following_username,
        }
        try:
            obj = queryset.get(**filter_kwargs)
            self.check_object_permissions(self.request, obj)
            return obj
        except ObjectDoesNotExist:
            return Response(status=status.HTTP_204_NO_CONTENT)

    def get(self, request, follower_username, following_username, format=None):
        follow = self.get_object(follower_username, following_username)
        if isinstance(follow, Response):
            return follow
        serializer = FollowSerializer(follow)
        return Response(serializer.data)

    def post(self, request, follower_username, following_username, format=None):
        follower = generics.get_object_or_404(CustomUser, username=follower_username)
        followee = generics.get_object_or_404(CustomUser, username=following_username)
        follow, created = Follow.objects.get_or_create(follower=follower, following=followee)

        if created:
            serializer = FollowSerializer(follow)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response({"detail": "Follow relationship already exists."}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, follower_username, following_username, format=None):
        follow = self.get_object(follower_username, following_username)
        follow.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserFollowingListView(APIView):
    permission_classes = [AllowAny]
    serializer_class = FollowSerializer

    def get(self, request, username, format=None):
        follows = Follow.objects.filter(follower__username=username)
        serializer = FollowSerializer(follows, many=True)
        return Response(serializer.data)


class UserFollowersListView(APIView):
    permission_classes = [AllowAny]
    serializer_class = FollowSerializer

    def get(self, request, username, format=None):
        followers = Follow.objects.filter(following__username=username)
        serializer = FollowSerializer(followers, many=True)
        return Response(serializer.data)


class UserRegistrationView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = UserRegistrationSerializer

    def create(self, request, *args, **kwargs):
        recaptcha_token = request.data.get('recaptcha')
        is_valid, response = verify_recaptcha(recaptcha_token)

        if not is_valid:
            return response

        # If reCAPTCHA is valid, proceed with the original registration logic
        return super().create(request, *args, **kwargs)
