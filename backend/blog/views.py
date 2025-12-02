from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import generics, mixins, status, viewsets
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from celery.result import AsyncResult

from api.permissions import IsAuthorOrAdmin, IsNotHidden

from .models import BlogPost, Comment, Like
from .pagination import CustomPageNumberPagination
from .serializers import BlogPostSerializer, CommentSerializer, LikeSerializer
from .tasks import (
    process_blog_post_creation,
    process_blog_post_update,
    process_blog_post_deletion,
    process_comment_creation,
    process_comment_update,
    process_comment_deletion
)

User = get_user_model()


class BlogPostTaskStatusView(generics.GenericAPIView):
    """
    Check the status of a blog post creation task.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, task_id):
        try:
            result = AsyncResult(task_id)
            
            if result.ready():
                if result.successful():
                    task_result = result.get()
                    if task_result.get('success'):
                        return Response({
                            'status': 'completed',
                            'result': task_result
                        })
                    else:
                        return Response({
                            'status': 'failed',
                            'error': task_result.get('error', 'Unknown error')
                        }, status=status.HTTP_400_BAD_REQUEST)
                else:
                    return Response({
                        'status': 'failed',
                        'error': str(result.result)
                    }, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({
                    'status': 'processing',
                    'message': 'Task is still being processed'
                })
                
        except Exception as e:
            return Response({
                'status': 'error',
                'error': f'Failed to check task status: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BlogPostUpdateTaskStatusView(generics.GenericAPIView):
    """
    Check the status of a blog post update task.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk, task_id):
        try:
            result = AsyncResult(task_id)
            
            if result.ready():
                if result.successful():
                    task_result = result.get()
                    if task_result.get('success'):
                        return Response({
                            'status': 'completed',
                            'result': task_result
                        })
                    else:
                        return Response({
                            'status': 'failed',
                            'error': task_result.get('error', 'Unknown error')
                        }, status=status.HTTP_400_BAD_REQUEST)
                else:
                    return Response({
                        'status': 'failed',
                        'error': str(result.result)
                    }, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({
                    'status': 'processing',
                    'message': 'Task is still being processed'
                })
                
        except Exception as e:
            return Response({
                'status': 'error',
                'error': f'Failed to check task status: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BlogPostDeleteTaskStatusView(generics.GenericAPIView):
    """
    Check the status of a blog post deletion task.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk, task_id):
        try:
            result = AsyncResult(task_id)
            
            if result.ready():
                if result.successful():
                    task_result = result.get()
                    if task_result.get('success'):
                        return Response({
                            'status': 'completed',
                            'result': task_result
                        })
                    else:
                        return Response({
                            'status': 'failed',
                            'error': task_result.get('error', 'Unknown error')
                        }, status=status.HTTP_400_BAD_REQUEST)
                else:
                    return Response({
                        'status': 'failed',
                        'error': str(result.result)
                    }, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({
                    'status': 'processing',
                    'message': 'Task is still being processed'
                })
                
        except Exception as e:
            return Response({
                'status': 'error',
                'error': f'Failed to check task status: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BlogPostList(generics.ListCreateAPIView):
    serializer_class = BlogPostSerializer
    pagination_class = CustomPageNumberPagination
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return BlogPost.objects.filter(hidden=False, is_draft=False).order_by(
            "-pub_date"
        )

    def create(self, request, *args, **kwargs):
        """
        Create a blog post asynchronously using Celery.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Prepare data for async processing
        post_data = {
            'title': serializer.validated_data.get('title', ''),
            'content': serializer.validated_data.get('content', ''),
            'is_draft': serializer.validated_data.get('is_draft', True),
            'accent_color': serializer.validated_data.get('accent_color', '#FFFFFF'),
        }
        
        # Handle tags if provided
        if 'tags' in serializer.validated_data:
            post_data['tags'] = [tag.id for tag in serializer.validated_data['tags']]
        
        # Handle image if provided
        if 'image' in serializer.validated_data:
            post_data['image'] = serializer.validated_data['image']
        
        # Queue the async task
        task = process_blog_post_creation.delay(request.user.id, post_data)
        
        return Response({
            'task_id': task.id,
            'status': 'processing',
            'message': 'Blog post creation queued for processing'
        }, status=status.HTTP_202_ACCEPTED)


class BlogPostRetrieveUpdateDestroy(generics.RetrieveUpdateDestroyAPIView):
    queryset = BlogPost.objects.all()
    serializer_class = BlogPostSerializer
    lookup_field = "pk"
    permission_classes = [IsAuthenticatedOrReadOnly, (IsNotHidden | IsAuthorOrAdmin)]

    def update(self, request, *args, **kwargs):
        """
        Update a blog post asynchronously using Celery.
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        # Check permissions
        if instance.author != request.user and not request.user.is_staff:
            return Response({
                'error': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Prepare data for async processing
        post_data = {}
        if 'title' in serializer.validated_data:
            post_data['title'] = serializer.validated_data['title']
        if 'content' in serializer.validated_data:
            post_data['content'] = serializer.validated_data['content']
        if 'is_draft' in serializer.validated_data:
            post_data['is_draft'] = serializer.validated_data['is_draft']
        if 'accent_color' in serializer.validated_data:
            post_data['accent_color'] = serializer.validated_data['accent_color']
        if 'image' in serializer.validated_data:
            post_data['image'] = serializer.validated_data['image']
        
        # Handle tags if provided
        if 'tags' in serializer.validated_data:
            post_data['tags'] = [tag.id for tag in serializer.validated_data['tags']]
        
        # Queue the async task
        task = process_blog_post_update.delay(instance.id, request.user.id, post_data)
        
        return Response({
            'task_id': task.id,
            'status': 'processing',
            'message': 'Blog post update queued for processing'
        }, status=status.HTTP_202_ACCEPTED)

    def partial_update(self, request, *args, **kwargs):
        """
        Partially update a blog post asynchronously using Celery.
        """
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """
        Delete a blog post asynchronously using Celery.
        """
        instance = self.get_object()
        
        # Check permissions
        if instance.author != request.user and not request.user.is_staff:
            return Response({
                'error': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Queue the async task
        task = process_blog_post_deletion.delay(instance.id, request.user.id)
        
        return Response({
            'task_id': task.id,
            'status': 'processing',
            'message': 'Blog post deletion queued for processing'
        }, status=status.HTTP_202_ACCEPTED)


class BlogPostLikeView(
    mixins.CreateModelMixin, mixins.DestroyModelMixin, generics.GenericAPIView
):
    permission_classes = [IsAuthenticated]
    lookup_url_kwarg = "post_id"
    serializer_class = LikeSerializer

    def get_queryset(self):
        return Like.objects.filter(post_id=self.kwargs[self.lookup_url_kwarg])

    def perform_create(self, serializer):
        # Retrieve the post using the post_id from the URL kwargs
        post_id = self.kwargs.get(self.lookup_url_kwarg)
        post = get_object_or_404(BlogPost, id=post_id)
        # Pass the post object directly to the serializer's save method
        serializer.save(user=self.request.user, post=post)

    def post(self, request, *args, **kwargs):
        # Check if the like already exists
        if self.get_queryset().filter(user=request.user).exists():
            return Response(
                {"detail": "You have already liked this post"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        else:
            # Proceed to create the like using the perform_create method logic
            return self.create(request, *args, **kwargs)

    def delete(self, request, *args, **kwargs):
        post_id = self.kwargs.get(self.lookup_url_kwarg)
        user = request.user
        like_instance = Like.objects.filter(post_id=post_id, user=user).first()

        if like_instance:
            # If the like instance is found, delete it and return a success response
            like_instance.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        else:
            # If no like instance is found, return a 404 response
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


class CommentTaskStatusView(generics.GenericAPIView):
    """
    Check the status of a comment task.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, post_id, task_id):
        try:
            result = AsyncResult(task_id)
            
            if result.ready():
                if result.successful():
                    task_result = result.get()
                    if task_result.get('success'):
                        return Response({
                            'status': 'completed',
                            'result': task_result
                        })
                    else:
                        return Response({
                            'status': 'failed',
                            'error': task_result.get('error', 'Unknown error')
                        }, status=status.HTTP_400_BAD_REQUEST)
                else:
                    return Response({
                        'status': 'failed',
                        'error': str(result.result)
                    }, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({
                    'status': 'processing',
                    'message': 'Task is still being processed'
                })
                
        except Exception as e:
            return Response({
                'status': 'error',
                'error': f'Failed to check task status: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all().order_by("-pub_date")
    serializer_class = CommentSerializer
    lookup_field = "pk"

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action == 'create':
            # For creating comments, only require authentication
            permission_classes = [IsAuthenticated]
        else:
            # For other actions (retrieve, update, delete), check object permissions
            permission_classes = [IsAuthenticatedOrReadOnly, (IsNotHidden | IsAuthorOrAdmin)]
        
        return [permission() for permission in permission_classes]

    def create(self, request, *args, **kwargs):
        """
        Create a comment asynchronously using Celery.
        """
        post_id = self.kwargs.get("post_id")
        if not post_id:
            return Response({
                'error': 'Post ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate that the post exists
        try:
            BlogPost.objects.get(id=post_id)
        except BlogPost.DoesNotExist:
            return Response({
                'error': 'Blog post not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Prepare data for async processing
        comment_data = {
            'content': serializer.validated_data.get('content', ''),
        }
        
        # Queue the async task
        task = process_comment_creation.delay(request.user.id, post_id, comment_data)
        
        return Response({
            'task_id': task.id,
            'status': 'processing',
            'message': 'Comment creation queued for processing'
        }, status=status.HTTP_202_ACCEPTED)

    def update(self, request, *args, **kwargs):
        """
        Update a comment asynchronously using Celery.
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        # Check permissions
        if instance.author != request.user and not request.user.is_staff:
            return Response({
                'error': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Prepare data for async processing
        comment_data = {}
        if 'content' in serializer.validated_data:
            comment_data['content'] = serializer.validated_data['content']
        
        # Queue the async task
        task = process_comment_update.delay(instance.id, request.user.id, comment_data)
        
        return Response({
            'task_id': task.id,
            'status': 'processing',
            'message': 'Comment update queued for processing'
        }, status=status.HTTP_202_ACCEPTED)

    def partial_update(self, request, *args, **kwargs):
        """
        Partially update a comment asynchronously using Celery.
        """
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """
        Delete a comment asynchronously using Celery.
        """
        instance = self.get_object()
        
        # Check permissions
        if instance.author != request.user and not request.user.is_staff:
            return Response({
                'error': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Queue the async task
        task = process_comment_deletion.delay(instance.id, request.user.id)
        
        return Response({
            'task_id': task.id,
            'status': 'processing',
            'message': 'Comment deletion queued for processing'
        }, status=status.HTTP_202_ACCEPTED)

    def get_queryset(self):
        post_id = self.kwargs.get("post_id")
        return Comment.objects.filter(blog_post_id=post_id, hidden=False)


class CommentListView(generics.ListAPIView):
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        post_id = self.kwargs.get("post_id")
        return Comment.objects.filter(blog_post_id=post_id, hidden=False).order_by("-pub_date")
