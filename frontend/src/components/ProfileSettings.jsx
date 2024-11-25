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
  TextField,
  Divider,
  Skeleton,
} from '@mui/material';
import api from '../utils/api';
import UserContext from './contexts/UserContext';
import { handleLogout } from '../utils/auth';

const ProfileSettings = () => {
  const [open, setOpen] = useState(false);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [siteSettingsOpen, setSiteSettingsOpen] = useState(false);
  const [siteTitle, setSiteTitle] = useState('');
  const [savingTitle, setSavingTitle] = useState(false);
  const [loadingTitle, setLoadingTitle] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', isError: false });
  const { user, isAuthenticated } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSiteInfo();
    }
  }, [isAuthenticated]);

  const fetchSiteInfo = async () => {
    setLoadingTitle(true);
    try {
      const response = await api.get('/core/site-title/');
      setSiteTitle(response.data.site_name);
    } catch (error) {
      console.error('Error fetching site info:', error);
    }
    setLoadingTitle(false);
  };

  const handleSaveSiteTitle = async () => {
    setSavingTitle(true);
    try {
      await api.put('/core/site-title/', { site_name: siteTitle });
      setSiteSettingsOpen(false);
      setNotification({
        open: true,
        message: 'Site title has been updated successfully!',
        isError: false
      });
    } catch (error) {
      console.error('Error updating site title:', error);
      setNotification({
        open: true,
        message: 'Failed to update site title. Please try again.',
        isError: true
      });
    }
    setSavingTitle(false);
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleSiteSettingsOpen = async () => {
    setSiteSettingsOpen(true);
    await fetchSiteInfo();
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
        Settings
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Profile Settings
        </Typography>
        <Divider />
        <Typography variant="h6" gutterBottom>
          Welcome, {user.first_name} {user.last_name}!
        </Typography>

        <Button
          variant="contained"
          color="error"
          onClick={handleClickOpen}
          sx={{ mt: 2 }}
        >
          Delete Account
        </Button>
      </Box>

      {user.is_superuser && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            System Settings
          </Typography>
          <Divider />
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Site Title: {loadingTitle ? (
                <Skeleton variant="text" width={100} component="span" />
              ) : (
                <strong>{siteTitle}</strong>
              )}
            </Typography>
          </Box>
          {loadingTitle ? (
            <Box sx={{ mt: 1 }}>
              <Skeleton variant="rounded" width={100} height={36} animation="wave" />
            </Box>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleSiteSettingsOpen}
              sx={{ mt: 1 }}
            >
              Change
            </Button>
          )}

          <Dialog open={siteSettingsOpen} onClose={() => setSiteSettingsOpen(false)}>
            <DialogTitle>Change Site Title</DialogTitle>
            <DialogContent>
              {savingTitle || loadingTitle ? (
                <Box sx={{ width: '100%', my: 2 }}>
                  <LinearProgress />
                </Box>
              ) : (
                <>
                  <DialogContentText>
                    Update the site title below. This will be visible to all users.
                  </DialogContentText>
                  <TextField
                    autoFocus
                    margin="dense"
                    label="Site Title"
                    fullWidth
                    variant="outlined"
                    value={siteTitle}
                    onChange={(e) => setSiteTitle(e.target.value)}
                  />
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSiteSettingsOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveSiteTitle} disabled={savingTitle}>
                Save
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}

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

      <Dialog 
        open={notification.open} 
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <DialogTitle>
          {notification.isError ? 'Error' : 'Success'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {notification.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setNotification({ ...notification, open: false })}
            color={notification.isError ? "error" : "primary"}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfileSettings;