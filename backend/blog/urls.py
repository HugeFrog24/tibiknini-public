from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'posts/id/(?P<post_id>\d+)/comments', views.CommentViewSet, basename='comment')

urlpatterns = [
    path('posts/', views.BlogPostList.as_view(), name='blog_post_list'),
    path('posts/id/<int:pk>/like/', views.BlogPostLikeView.as_view(), name='blogpost-like'),
    path('posts/id/<int:pk>/', views.BlogPostRetrieveUpdateDestroy.as_view(), name='blogpost-retrieve-update-destroy'),
    path('posts/author/<str:username>/', views.BlogPostsByUserView.as_view(), name='blog_posts_by_user'),
    path('', include(router.urls)),  # include the router urls
]
