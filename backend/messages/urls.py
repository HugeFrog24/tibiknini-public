from django.urls import path
from .views import ContactMessageView

app_name = 'messages'

urlpatterns = [
    path('contact/', ContactMessageView.as_view()),
]
