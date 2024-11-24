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
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import api from '../utils/api';
import UserContext from './contexts/UserContext';
import { handleLogout } from '../utils/auth';

const ProfileSettings = () => {
  const [open, setOpen] = useState(false);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { user, isAuthenticated } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = async () => {
    setOpen(false);
    setConfirmDelete(false);
    if (deleteSuccess) {
      await handleLogout();
      navigate('/login');
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

  if (!isAuthenticated) {
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
            <>
              <DialogContentText>
              Are you sure you want to delete your profile, {user.first_name}?
                <Typography variant="body1" fontWeight="bold" component="div" gutterBottom>
                  This action is permanent and cannot be undone.
                </Typography>
              </DialogContentText>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={confirmDelete}
                    onChange={(e) => setConfirmDelete(e.target.checked)}
                  />
                }
                label="I understand the consequences of this action"
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={deleteInProgress}>
            {deleteSuccess ? 'Close' : 'Cancel'}
          </Button>
          {!deleteSuccess && (
            <Button 
              onClick={handleDeleteProfile} 
              color="error" 
              disabled={deleteInProgress || !confirmDelete}
            >
              Delete
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfileSettings;