import React from 'react';
import { Container, Typography } from '@mui/material';
import OnlineUsers from './OnlineUsers';

const OnlineUsersPage = () => {
  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>
        Online Users
      </Typography>
      <OnlineUsers />
    </Container>
  );
};

export default OnlineUsersPage;
