import React, { useEffect, useState } from 'react';
import { Avatar, Badge, List, ListItem, ListItemAvatar, ListItemText, Paper, Typography } from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import usePresence from '../hooks/usePresence';
import api from '../utils/api';

interface OnlineUsersProps {
  className?: string;
}

interface UserDetails {
  id: number;
  username: string;
  avatar?: string;
  email?: string;
}

const OnlineUsers: React.FC<OnlineUsersProps> = ({ className }) => {
  const { onlineUsers, isConnected } = usePresence();
  const [userDetails, setUserDetails] = useState<Record<string, UserDetails>>({});

  useEffect(() => {
    // Fetch user details for online users
    const fetchUserDetails = async () => {
      const uniqueUserIds = [...new Set(onlineUsers.map(user => user.user))];
      
      try {
        const userDetailsPromises = uniqueUserIds.map(userId => 
          api.get<UserDetails>(`/users/id/${userId}/`)
        );
        
        const responses = await Promise.all(userDetailsPromises);
        const newUserDetails: Record<string, UserDetails> = {};
        
        responses.forEach((response, index) => {
          newUserDetails[uniqueUserIds[index]] = response.data;
        });
        
        setUserDetails(newUserDetails);
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };

    if (onlineUsers.length > 0) {
      fetchUserDetails();
    }
  }, [onlineUsers]);

  const getStatusText = (user: { is_online: boolean; status?: string }) => {
    if (!user.is_online) return 'Offline';
    return user.status === 'away' ? 'Away' : 'Online';
  };

  const getStatusColor = (user: { is_online: boolean; status?: string }) => {
    if (!user.is_online) return 'text.disabled';
    return user.status === 'away' ? 'warning.main' : 'success.main';
  };

  return (
    <Paper elevation={3} sx={{ p: 2, maxWidth: 300 }} className={className}>
      <Typography variant="h6" gutterBottom>
        Online Users
        <Badge 
          color={isConnected ? "success" : "error"}
          variant="dot"
          sx={{ ml: 1 }}
        />
      </Typography>
      <List>
        {Array.isArray(onlineUsers) ? onlineUsers.map((user) => {
          const details = userDetails[user.user];
          return (
            <ListItem key={user.user}>
              <ListItemAvatar>
                <Avatar 
                  src={details?.avatar} 
                  alt={details?.username || 'User'}
                >
                  {details?.username?.[0]?.toUpperCase() || 'U'}
                </Avatar>
              </ListItemAvatar>
              <ListItemText 
                primary={details?.username || 'Loading...'}
                secondary={
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    <FiberManualRecordIcon 
                      sx={{ 
                        mr: 0.5, 
                        fontSize: 12, 
                        color: getStatusColor(user)
                      }} 
                    />
                    {getStatusText(user)}
                  </span>
                }
              />
            </ListItem>
          );
        }) : (
          <ListItem>
            <ListItemText primary="Loading users..." />
          </ListItem>
        )}
        {Array.isArray(onlineUsers) && onlineUsers.length === 0 && (
          <ListItem>
            <ListItemText primary="No users online" />
          </ListItem>
        )}
      </List>
    </Paper>
  );
};

export default OnlineUsers;
