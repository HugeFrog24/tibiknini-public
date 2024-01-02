from django.urls import path
from .views import (
    CheckUsernameView, ProfileDetailView, ProfileListView, CurrentUserView,
    ProfileImageDeleteView, ProfileImageUpdateView, FollowView, UserFollowingListView, UserFollowersListView,
    UserRegistrationView, UserBioRetrieveUpdateView
)

app_name = 'users'

urlpatterns = [
    path('me/', CurrentUserView.as_view(), name='current_user'),
    path('me/image/update/', ProfileImageUpdateView.as_view(), name='profile-image-update'),
    path('me/image/delete/', ProfileImageDeleteView.as_view(), name='profile-image-delete'),
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('<str:username>/check/', CheckUsernameView.as_view(), name='check-username'),
    path('<str:username>/bio/', UserBioRetrieveUpdateView.as_view(), name='bio-detail'),
    path('<str:username>/', ProfileDetailView.as_view(), name='profile_detail'),
    path(
        '<str:follower_username>/follows/<str:following_username>/', FollowView.as_view(), name='follow-detail'
    ),
    path('<str:username>/following/', UserFollowingListView.as_view(), name='user-following'),
    path('<str:username>/followers/', UserFollowersListView.as_view(), name='user-followers'),
]
