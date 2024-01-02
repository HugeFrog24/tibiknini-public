from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import Follow, Profile

User = get_user_model()


class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        source='profile.user.username'
    )  # Access the username field of the related User model through the 'profile' related name
    email = serializers.SerializerMethodField()
    image = serializers.ImageField(source="profile.image")
    date_joined = serializers.CharField(source='profile.user.date_joined')
    is_anonymous = serializers.BooleanField()
    is_staff = serializers.BooleanField(source='profile.user.is_staff')
    is_authenticated = serializers.BooleanField()
    followers = serializers.SerializerMethodField()
    following = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = [
            'id', 'username', 'date_joined', 'image', 'is_anonymous', 'email',
            'is_authenticated', 'is_staff', 'followers', 'following'
        ]

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if not instance.profile.image:
            request = self.context.get('request')
            ret['image'] = request.build_absolute_uri(f'{settings.MEDIA_URL}profile_pics/default.png')
        return ret

    def get_email(self, obj):
        # Check if the request user has administrative permissions
        user = self.context.get('request').user
        if user.is_staff:
            return obj.profile.user.email
        return None

    def get_followers(self, obj):
        return FollowSerializer(obj.followers.all(), many=True).data

    def get_following(self, obj):
        return FollowSerializer(obj.following.all(), many=True).data


class ProfileBioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ["bio"]


class ProfileImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ["image"]


class FollowSerializer(serializers.ModelSerializer):
    follower = serializers.StringRelatedField(read_only=True)
    following = serializers.StringRelatedField(read_only=True)
    follower_image = serializers.SerializerMethodField()
    following_image = serializers.SerializerMethodField()

    class Meta:
        model = Follow
        fields = ['follower', 'following', 'created_at', 'follower_image', 'following_image']

    def get_follower_image(self, obj):
        if hasattr(obj.follower, 'profile') and obj.follower.profile.image:
            return obj.follower.profile.image.url
        return None

    def get_following_image(self, obj):
        if hasattr(obj.following, 'profile') and obj.following.profile.image:
            return obj.following.profile.image.url
        return None


class UserRegistrationSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(style={'input_type': 'password'}, write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password', 'password2']
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'password': {'write_only': True},
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Passwords must match.'})
        validate_password(attrs['password'])  # Use Django's password validation
        return attrs

    def create(self, validated_data):
        user = User(
            email=validated_data['email'],
            username=validated_data['username'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name']
        )
        user.set_password(validated_data['password'])
        user.save()
        return user
