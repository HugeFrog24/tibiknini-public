from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(
    r"posts/id/(?P<post_id>\d+)/comments", views.CommentViewSet, basename="comment"
)

urlpatterns = [
    path("posts/", views.BlogPostList.as_view(), name="blog_post_list"),
    path(
        "posts/task-status/<str:task_id>/",
        views.BlogPostTaskStatusView.as_view(),
        name="blog_post_creation_task_status",
    ),
    path(
        "posts/id/<int:post_id>/like/",
        views.BlogPostLikeView.as_view(),
        name="blogpost-like",
    ),
    path(
        "posts/id/<int:pk>/",
        views.BlogPostRetrieveUpdateDestroy.as_view(),
        name="blogpost-retrieve-update-destroy",
    ),
    path(
        "posts/id/<int:pk>/task-status/<str:task_id>/",
        views.BlogPostUpdateTaskStatusView.as_view(),
        name="blog_post_update_task_status",
    ),
    path(
        "posts/id/<int:pk>/delete-task-status/<str:task_id>/",
        views.BlogPostDeleteTaskStatusView.as_view(),
        name="blog_post_delete_task_status",
    ),
    path(
        "posts/author/<str:username>/",
        views.BlogPostsByUserView.as_view(),
        name="blog_posts_by_user",
    ),
    path(
        "posts/id/<int:post_id>/comments/task-status/<str:task_id>/",
        views.CommentTaskStatusView.as_view(),
        name="comment_task_status",
    ),
    path("", include(router.urls)),  # include the router urls
]
