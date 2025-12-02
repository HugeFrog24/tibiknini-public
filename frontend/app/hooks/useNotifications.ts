import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

interface NotificationActor {
  id: number;
  username: string;
  image?: string;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  notification_type_display: string;
  actor: NotificationActor | null;
  actor_display_name: string;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
  content_url: string | null;
  extra_data: Record<string, any>;
  time_since: string;
}

interface NotificationStats {
  total_count: number;
  unread_count: number;
  read_count: number;
  recent_count: number;
  by_type: Record<string, number>;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async (unreadOnly = false, limit = 10) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new window.URLSearchParams();
      if (unreadOnly) params.append('unread_only', 'true');
      params.append('page_size', limit.toString());
      
      const response = await api.get(`/notifications/?${params.toString()}`);
      setNotifications(response.data.results || []);
    } catch (err) {
      setError('Failed to fetch notifications');
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await api.get('/notifications/unread-count/');
      setUnreadCount(response.data.unread_count);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      await api.patch(`/notifications/${notificationId}/`, { is_read: true });
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true, read_at: new Date().toISOString() }
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await api.post('/notifications/mark-read/');
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ 
          ...notification, 
          is_read: true, 
          read_at: new Date().toISOString() 
        }))
      );
      
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: number) => {
    try {
      await api.delete(`/notifications/${notificationId}/`);
      
      // Update local state
      const deletedNotification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Update unread count if the deleted notification was unread
      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }, [notifications]);

  // Get notification stats
  const fetchStats = useCallback(async (): Promise<NotificationStats | null> => {
    try {
      const response = await api.get('/notifications/stats/');
      return response.data;
    } catch (err) {
      console.error('Error fetching notification stats:', err);
      return null;
    }
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    try {
      await api.delete('/notifications/clear-all/');
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Error clearing all notifications:', err);
    }
  }, []);

  // Clear read notifications
  const clearReadNotifications = useCallback(async () => {
    try {
      await api.delete('/notifications/clear-read/');
      setNotifications(prev => prev.filter(n => !n.is_read));
    } catch (err) {
      console.error('Error clearing read notifications:', err);
    }
  }, []);

  // Auto-refresh unread count periodically
  useEffect(() => {
    fetchUnreadCount();
    
    const interval = window.setInterval(fetchUnreadCount, 30000); // Refresh every 30 seconds
    
    return () => window.clearInterval(interval);
  }, [fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchStats,
    clearAllNotifications,
    clearReadNotifications
  };
};