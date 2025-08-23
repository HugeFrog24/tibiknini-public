import logging
import os
import secrets
from datetime import datetime, timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.cache import cache
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.core.mail import send_mail
from django.http import JsonResponse
from django.template.loader import render_to_string
from django.utils import timezone
from rest_framework import generics, parsers, status
from rest_framework.decorators import parser_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.permissions import IsAuthorOrAdmin
from api.utils.recaptcha import verify_recaptcha
from core.models import SiteInfo
from core.tasks import send_scheduled_email

from .models import CustomUser, Follow
from .serializers import (
    FollowSerializer,
    ProfileBioSerializer,
    ProfileImageSerializer,
    ProfileSerializer,
    UserProfileUpdateSerializer,
    UserRegistrationSerializer,
)
from .utils import process_profile_image
from .validators import (
    username_validator,
    validate_reserved_username,
    validate_unique_username,
)

logger = logging.getLogger(__name__)

User = get_user_model()


class ProfileListView(generics.ListAPIView):
    queryset = CustomUser.objects.select_related("profile").all()
    serializer_class = ProfileSerializer


class ProfileDetailView(generics.RetrieveAPIView):
    queryset = CustomUser.objects.select_related("profile").all()
    serializer_class = ProfileSerializer
    lookup_field = 'username'


class ProfileDetailByIdView(generics.RetrieveAPIView):
    """
    Retrieve a user profile by user ID.
    This is a separate endpoint from username-based lookup for security and clarity.
    """
    queryset = CustomUser.objects.select_related("profile").all()
    serializer_class = ProfileSerializer
    lookup_url_kwarg = 'user_id'
    lookup_field = 'id'


class CheckUsernameView(APIView):
    def get(self, request, username, format=None):
        data = {"username": username}
        try:
            validate_unique_username(username)
            username_validator(username)
            validate_reserved_username(username)
            data["status"] = "ok"
            return JsonResponse(data, status=status.HTTP_200_OK)
        except ValidationError as e:
            if "already taken" in str(e):
                data["status"] = "taken"
                return JsonResponse(data, status=status.HTTP_409_CONFLICT)
            elif "reserved" in str(e):
                data["status"] = "reserved"
                return JsonResponse(data, status=status.HTTP_403_FORBIDDEN)
            else:
                data["status"] = "error"
                data["message"] = str(e)
                return JsonResponse(data, status=status.HTTP_400_BAD_REQUEST)


class CurrentUserView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ProfileSerializer

    def get_object(self):
        return self.request.user


class UserProfileUpdateView(generics.UpdateAPIView):
    """Update user profile information (first_name, last_name)"""
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileUpdateSerializer

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        # Return the updated user data in the same format as the login response
        user = self.get_object()
        return Response({
            "detail": "Profile updated successfully.",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser,
            }
        })


class UserBioRetrieveUpdateView(generics.RetrieveUpdateAPIView):
    """
    Retrieve or update the bio of the specified user.
    """

    queryset = CustomUser.objects.select_related("profile").all()
    serializer_class = ProfileBioSerializer
    lookup_field = "username"

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

        serializer = ProfileImageSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)


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
            "follower__username": follower_username,
            "following__username": following_username,
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
        follow, created = Follow.objects.get_or_create(
            follower=follower, following=followee
        )

        if created:
            serializer = FollowSerializer(follow)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(
                {"detail": "Follow relationship already exists."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def delete(self, request, follower_username, following_username, format=None):
        follow = self.get_object(follower_username, following_username)
        if isinstance(follow, Response):
            return follow
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
        recaptcha_token = request.data.get("recaptcha")
        is_valid, response = verify_recaptcha(recaptcha_token)

        if not is_valid:
            return response

        # If reCAPTCHA is valid, proceed with the original registration logic
        return super().create(request, *args, **kwargs)


class ProfileDeleteView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated, IsAuthorOrAdmin]
    serializer_class = ProfileSerializer

    def get_object(self):
        return self.request.user.profile

    def perform_destroy(self, instance):
        user = instance.user
        instance.delete()
        user.delete()


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")
        confirm_password = request.data.get("confirm_password")

        # Validate required fields
        if not old_password:
            return Response(
                {"error": "Current password is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        if not new_password:
            return Response(
                {"error": "New password is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        if not confirm_password:
            return Response(
                {"error": "Password confirmation is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if new password matches confirmation
        if new_password != confirm_password:
            return Response(
                {"error": "New password and confirmation do not match"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check current password
        if not user.check_password(old_password):
            return Response(
                {"error": "Current password is incorrect"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate new password using Django's password validators
        try:
            validate_password(new_password, user)
        except ValidationError as e:
            return Response(
                {"error": list(e.messages)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Set new password
        user.set_password(new_password)
        user.save()  # This will trigger our password change signal

        logger.info(f"Password changed successfully for user: {user.username}")
        return Response(
            {"message": "Password changed successfully"}, status=status.HTTP_200_OK
        )


class RequestPasswordResetView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Return success even if email doesn't exist for security
            return Response(
                {
                    "message": "If an account exists with this email, a password reset link will be sent."
                },
                status=status.HTTP_200_OK,
            )

        # Generate a secure token
        reset_token = secrets.token_urlsafe(32)

        # Store token in cache with 30 minutes expiry
        token_key = f"password_reset_{reset_token}"
        cache.set(token_key, user.id, timeout=1800)  # 30 minutes in seconds

        # Get site information for email context
        site_info = SiteInfo.objects.first()
        site_title = site_info.site_title if site_info else "Our Platform"

        # Get frontend URL from DOMAIN_NAME environment variable
        domain_name = os.environ.get("DOMAIN_NAME")
        frontend_url = f"https://{domain_name}"

        # Send reset email
        subject = f"Password Reset Request - {site_title}"
        context = {
            "username": user.username,
            "site_title": site_title,
            "reset_token": reset_token,
            "token_expiry_minutes": 30,
            "frontend_url": frontend_url,
        }

        try:
            send_scheduled_email.delay(
                subject=subject,
                recipient_list=[user.email],
                template_name="emails/password_reset.txt",
                context=context,
            )
        except Exception as e:
            logger.error(f"Failed to send password reset email: {str(e)}")
            return Response(
                {"error": "Failed to send reset email"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {"message": "Password reset instructions have been sent to your email."},
            status=status.HTTP_200_OK,
        )


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get("token")
        new_password = request.data.get("new_password")

        if not token or not new_password:
            return Response(
                {"error": "Token and new password are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if token exists and get user_id
        token_key = f"password_reset_{token}"
        user_id = cache.get(token_key)

        if not user_id:
            return Response(
                {"error": "Invalid or expired token"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(id=user_id)
            user.set_password(new_password)
            user.save()  # This will trigger our password change notification

            # Delete the used token
            cache.delete(token_key)

            return Response(
                {"message": "Password has been reset successfully"},
                status=status.HTTP_200_OK,
            )
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"}, status=status.HTTP_400_BAD_REQUEST
            )
