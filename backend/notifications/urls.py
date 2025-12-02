from django.urls import path
from . import views

app_name = 'notifications'

urlpatterns = [
    # Notification CRUD operations
    path('', views.NotificationListView.as_view(), name='notification-list'),
    path('<int:pk>/', views.NotificationDetailView.as_view(), name='notification-detail'),
    
    # Notification actions
    path('mark-read/', views.mark_notifications_read, name='mark-notifications-read'),
    path('stats/', views.notification_stats, name='notification-stats'),
    path('unread-count/', views.unread_count, name='unread-count'),
    
    # Bulk operations
    path('clear-all/', views.clear_all_notifications, name='clear-all-notifications'),
    path('clear-read/', views.clear_read_notifications, name='clear-read-notifications'),
    
    # User preferences
    path('preferences/', views.NotificationPreferenceView.as_view(), name='notification-preferences'),
]