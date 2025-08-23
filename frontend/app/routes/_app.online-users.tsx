import React from 'react';
import { Container, Typography } from '@mui/material';
import type { MetaFunction } from 'react-router';
import OnlineUsers from '../components/OnlineUsers';

export const meta: MetaFunction = () => {
  return [
    { title: "Online Users" },
    { name: "description", content: "See who's currently online" },
  ];
};

export default function OnlineUsersRoute() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Online Users
      </Typography>
      <OnlineUsers />
    </Container>
  );
}
