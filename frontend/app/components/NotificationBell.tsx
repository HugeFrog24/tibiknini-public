import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Avatar,
  Divider,
  Button,
  Chip,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  MarkEmailRead as MarkEmailReadIcon,
  Delete as DeleteIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useNotifications } from '../hooks/useNotifications';

const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications
  } = useNotifications();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [hasLoadedNotifications, setHasLoadedNotifications] = useState(false);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    
    // Load notifications when menu opens
    if (!hasLoadedNotifications) {
      fetchNotifications(false, 10);
      setHasLoadedNotifications(true);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification: any) => {
    // Mark as read if unread
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Navigate to content if URL is available
    if (notification.content_url) {
      navigate(notification.content_url);
    }

    handleClose();
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const handleDeleteNotification = async (notificationId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    await deleteNotification(notificationId);
  };

  const handleClearRead = async () => {
    await clearReadNotifications();
  };

  const handleViewAll = () => {
    navigate('/notifications');
    handleClose();
  };

  const getNotificationIcon = (notificationType: string) => {
    // You can customize icons based on notification type
    switch (notificationType) {
      case 'comment_on_post':
        return '💬';
      case 'new_follower':
        return '👤';
      case 'post_liked':
        return '❤️';
      case 'content_moderated':
        return '⚠️';
      default:
        return '🔔';
    }
  };


  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          color="inherit"
          onClick={handleClick}
          aria-label="notifications"
          aria-controls="notification-menu"
          aria-haspopup="true"
        >
          <Badge badgeContent={unreadCount} color="error" max={99}>
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        id="notification-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 500,
            overflow: 'auto'
          }
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Notifications
            </Typography>
            <Box>
              {unreadCount > 0 && (
                <Tooltip title="Mark all as read">
                  <IconButton size="small" onClick={handleMarkAllRead}>
                    <MarkEmailReadIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Clear read notifications">
                <IconButton size="small" onClick={handleClearRead}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          {unreadCount > 0 && (
            <Typography variant="caption" color="text.secondary">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </Typography>
          )}
        </Box>

        {/* Loading state */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {/* Notifications list */}
        {!isLoading && notifications.length > 0 ? (
          notifications.map((notification, index) => (
            <React.Fragment key={notification.id}>
              <MenuItem
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  py: 1.5,
                  px: 2,
                  alignItems: 'flex-start',
                  backgroundColor: notification.is_read ? 'transparent' : 'action.hover',
                  '&:hover': {
                    backgroundColor: 'action.selected'
                  }
                }}
              >
                <Box sx={{ display: 'flex', width: '100%', alignItems: 'flex-start' }}>
                  {/* Notification icon/avatar */}
                  <Box sx={{ mr: 1.5, mt: 0.5 }}>
                    {notification.actor?.image ? (
                      <Avatar
                        src={notification.actor.image}
                        alt={notification.actor.username}
                        sx={{ width: 32, height: 32 }}
                      />
                    ) : (
                      <Typography sx={{ fontSize: '1.2rem' }}>
                        {getNotificationIcon(notification.notification_type)}
                      </Typography>
                    )}
                  </Box>

                  {/* Notification content */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: notification.is_read ? 'normal' : 'medium',
                        mb: 0.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {notification.title}
                    </Typography>
                    
                    {notification.message && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          mb: 0.5
                        }}
                      >
                        {notification.message}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        {notification.time_since}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {!notification.is_read && (
                          <Chip
                            label="New"
                            size="small"
                            color="primary"
                            sx={{ height: 16, fontSize: '0.6rem' }}
                          />
                        )}
                        <Tooltip title="Delete notification">
                          <IconButton
                            size="small"
                            onClick={(e) => handleDeleteNotification(notification.id, e)}
                            sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </MenuItem>
              {index < notifications.length - 1 && <Divider />}
            </React.Fragment>
          ))
        ) : !isLoading ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No notifications yet
            </Typography>
          </Box>
        ) : null}

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <Divider />
            <Box sx={{ p: 1 }}>
              <Button
                fullWidth
                variant="text"
                onClick={handleViewAll}
                sx={{ justifyContent: 'center' }}
              >
                View All Notifications
              </Button>
            </Box>
          </>
        )}
      </Menu>
    </>
  );
};

export default NotificationBell;