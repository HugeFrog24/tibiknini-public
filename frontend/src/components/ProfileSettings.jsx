import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  LinearProgress,
  Typography,
  Box,
} from '@mui/material';
import api from '../utils/api';
import UserContext from './contexts/UserContext';
import { handleLogout } from '../utils/auth';

const ProfileSettings = () => {
  const [open, setOpen] = useState(false);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const user = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = async () => {
    setOpen(false);
    if (deleteSuccess) {
      await handleLogout(); // Log out the user
      navigate('/login'); // Redirect to login page
    }
  };

  const handleDeleteProfile = async () => {
    setDeleteInProgress(true);
    try {
      await api.delete('/users/me/delete/');
      setDeleteSuccess(true);
    } catch (error) {
      console.error('Error deleting profile:', error);
      // Handle error, e.g., show error message to the user
    }
    setDeleteInProgress(false);
  };

  if (!user) {
    return null; // Optionally, you can return a loading spinner or a message here
  }

  return (
    <Box className="container">
      <Typography variant="h4" gutterBottom>
        Profile Settings
      </Typography>
      <Typography variant="h6" gutterBottom>
        Welcome, {user.first_name} {user.last_name}!
      </Typography>
      <Button variant="contained" color="error" onClick={handleClickOpen}>
        Delete Profile
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Delete Profile</DialogTitle>
        <DialogContent>
          {deleteInProgress ? (
            <LinearProgress />
          ) : deleteSuccess ? (
            <DialogContentText>Profile deleted successfully!</DialogContentText>
          ) : (
            <DialogContentText>
              Are you sure you want to delete your profile, {user.first_name}?
              <Typography variant="body1" fontWeight="bold" component="div" gutterBottom>
                This action cannot be undone.
              </Typography>
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={deleteInProgress}>
            {deleteSuccess ? 'Close' : 'Cancel'}
          </Button>
          {!deleteSuccess && (
            <Button onClick={handleDeleteProfile} color="error" disabled={deleteInProgress}>
              Delete
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfileSettings;