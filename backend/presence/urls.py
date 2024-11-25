from django.urls import path

from . import views

app_name = "presence"

urlpatterns = [
    path("", views.UserPresenceList.as_view(), name="user-presence-list"),
    path(
        "<str:user__username>/",
        views.UserPresenceDetail.as_view(),
        name="user-presence-detail",
    ),
]
