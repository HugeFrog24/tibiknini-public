import React from 'react';
import { Badge, List, ListItem, ListItemText, Paper, Typography } from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import usePresence from '../hooks/usePresence';

const OnlineUsers = () => {
  const { onlineUsers, isConnected } = usePresence();

  return (
    <Paper elevation={3} sx={{ p: 2, maxWidth: 300 }}>
      <Typography variant="h6" gutterBottom>
        Online Users
        <Badge 
          color={isConnected ? "success" : "error"}
          variant="dot"
          sx={{ ml: 1 }}
        />
      </Typography>
      <List>
        {Array.isArray(onlineUsers) ? onlineUsers.map((user) => (
          <ListItem key={user.user}>
            <FiberManualRecordIcon 
              sx={{ 
                mr: 1, 
                fontSize: 12, 
                color: user.is_online ? 'success.main' : 'text.disabled' 
              }} 
            />
            <ListItemText 
              primary={user.username}
              secondary={user.is_online ? 'Online' : 'Offline'}
            />
          </ListItem>
        )) : (
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
