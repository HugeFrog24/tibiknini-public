import React, { useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, LinearProgress } from '@mui/material';
import api from '../utils/api';

const ProfileSettings = () => {
  const [open, setOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleDeleteConfirm = () => {
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirmClose = () => {
    setDeleteConfirmOpen(false);
    setDeleteSuccess(false);
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

  return (
    <div className="container">
      <h2>Profile Settings</h2>
      <Button variant="contained" color="error" onClick={handleClickOpen}>
        Delete Profile
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Delete Profile</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete your profile? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={deleteConfirmOpen} onClose={handleDeleteConfirmClose}>
        <DialogTitle>Deleting Profile</DialogTitle>
        <DialogContent>
          {deleteInProgress ? (
            <LinearProgress />
          ) : deleteSuccess ? (
            <DialogContentText>Profile deleted successfully!</DialogContentText>
          ) : (
            <DialogContentText>Are you sure you want to delete your profile?</DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteConfirmClose} disabled={deleteInProgress}>
            {deleteSuccess ? 'Close' : 'Cancel'}
          </Button>
          {!deleteSuccess && (
            <Button onClick={handleDeleteProfile} color="error" disabled={deleteInProgress}>
              Delete
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ProfileSettings;