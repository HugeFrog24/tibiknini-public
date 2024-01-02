from rest_framework import serializers
from django.template.defaultfilters import truncatewords

from blog.models import BlogPost, Tag, Like, Comment
from users.models import Profile


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ("name", "color")


class BlogPostAuthorSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="profile.user.username")
    image = serializers.ImageField(source="profile.image")
    is_staff = serializers.BooleanField(source="profile.user.is_staff")

    class Meta:
        model = Profile
        fields = ["id", "username", "image", "is_staff", "bio"]


class LikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Like
        fields = ("user", "post", "created")


class BlogPostSerializer(serializers.ModelSerializer):
    # Replace the default author field with a nested ProfileSerializer and set it as read-only:
    author = BlogPostAuthorSerializer(read_only=True)
    is_draft = serializers.BooleanField()
    tags = TagSerializer(many=True, read_only=True)
    likes_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = BlogPost
        fields = (
            "id",
            "author",
            "title",
            "content",
            "pub_date",
            "image",
            "is_draft",
            "tags",
            "likes_count",
            "is_liked",
            "accent_color",
        )

    def get_likes_count(self, obj):
        return obj.like_set.count()

    def get_is_liked(self, obj):
        user = self.context["request"].user
        if user.is_authenticated:
            is_liked = obj.like_set.filter(user_id=user.id).exists()
            return is_liked
        return False

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation["summary"] = truncatewords(instance.content, 50)
        return representation


class CommentAuthorSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="profile.user.username")
    image = serializers.ImageField(source="profile.image")
    is_staff = serializers.BooleanField(source="profile.user.is_staff")

    class Meta:
        model = Profile
        fields = ["id", "username", "image", "is_staff", "bio"]


class CommentSerializer(serializers.ModelSerializer):
    author = CommentAuthorSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ("id", "blog_post", "author", "content", "pub_date")
