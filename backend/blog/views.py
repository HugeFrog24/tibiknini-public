from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import generics, mixins, status, viewsets
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response

from api.permissions import IsNotHidden, IsAuthorOrAdmin
from .models import BlogPost, Like, Comment
from .pagination import CustomPageNumberPagination
from .serializers import BlogPostSerializer, CommentSerializer

User = get_user_model()


class BlogPostList(generics.ListCreateAPIView):
    serializer_class = BlogPostSerializer
    pagination_class = CustomPageNumberPagination
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return BlogPost.objects.filter(hidden=False, is_draft=False).order_by(
            "-pub_date"
        )

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class BlogPostRetrieveUpdateDestroy(generics.RetrieveUpdateDestroyAPIView):
    queryset = BlogPost.objects.all()
    serializer_class = BlogPostSerializer
    lookup_field = "pk"
    permission_classes = [IsAuthenticatedOrReadOnly, (IsNotHidden | IsAuthorOrAdmin)]

    def perform_update(self, serializer):
        serializer.validated_data.pop("author", None)
        serializer.save()


class BlogPostLikeView(
    mixins.CreateModelMixin, mixins.DestroyModelMixin, generics.GenericAPIView
):
    permission_classes = [IsAuthenticated]
    lookup_field = "pk"
    lookup_url_kwarg = "post_id"

    def get_queryset(self):
        return Like.objects.filter(post_id=self.kwargs[self.lookup_url_kwarg])

    def post(self, request, *args, **kwargs):
        if self.get_queryset().filter(user=request.user).exists():
            return Response(
                {"detail": "You have already liked this post"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return self.create(request, *args, **kwargs)

    def delete(self, request, *args, **kwargs):
        instance = self.get_queryset().filter(user=request.user).first()
        if instance:
            self.destroy(request, *args, **kwargs)
        else:
            return Response(
                {"detail": "Like not found"}, status=status.HTTP_404_NOT_FOUND
            )


class BlogPostsByUserView(generics.ListAPIView):
    serializer_class = BlogPostSerializer

    def get_queryset(self):
        username = self.kwargs["username"]
        # Check if the username is the reserved keyword "me"
        if username == "me":
            user = self.request.user
            if (
                not user.is_authenticated
            ):  # Handle the case when the user is not authenticated
                return BlogPost.objects.none()
            return BlogPost.objects.filter(
                author=user, hidden=False, is_draft=False
            ).order_by("-pub_date")
        else:
            user = get_object_or_404(User, username=username)
            return BlogPost.objects.filter(
                author=user, hidden=False, is_draft=False
            ).order_by("-pub_date")


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all().order_by('-pub_date')
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, (IsNotHidden | IsAuthorOrAdmin)]
    lookup_field = "pk"

    def perform_create(self, serializer):
        post_id = self.kwargs.get("post_id")
        post = get_object_or_404(BlogPost, pk=post_id)
        serializer.save(author=self.request.user, blog_post=post)

    def get_queryset(self):
        post_id = self.kwargs.get("post_id")
        return Comment.objects.filter(blog_post_id=post_id)


class CommentListView(generics.ListAPIView):
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        post_id = self.kwargs.get("post_id")
        return Comment.objects.filter(blog_post_id=post_id).order_by("-pub_date")
