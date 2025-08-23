import React from 'react';
import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router';
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
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import api from '../utils/api';
import UserContext from '../contexts/UserContext';
import { handleLogout as handleLogoutUtil } from '../utils/auth';
import ProfileImage from './ProfileImage';
import { PasswordField, validatePassword, validatePasswordMatch } from '../utils/passwordValidation';


interface NotificationState {
  open: boolean;
  message: string;
  isError: boolean;
}

const containerStyles: SxProps<Theme> = {
  p: 3,
  maxWidth: 'md',
  mx: 'auto',
};

const sectionStyles: SxProps<Theme> = {
  mb: 4,
};

export default function ProfileSettings() {
  const [open, setOpen] = useState(false);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [siteSettingsOpen, setSiteSettingsOpen] = useState(false);
  const [siteTitle, setSiteTitle] = useState('');
  const [savingTitle, setSavingTitle] = useState(false);
  const [loadingTitle, setLoadingTitle] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    isError: false
  });
  const [editingName, setEditingName] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [savingName, setSavingName] = useState(false);
  
  // Password change state
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const { user, isAuthenticated, isLoading, updateUser } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect if loading is complete and user is not authenticated
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSiteInfo();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
    }
  }, [user]);

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
      // Invalidate the site title cache after successful update
      
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
      // Create a wrapper function that matches the expected signature
      const handleLogout = () => handleLogoutUtil(navigate, () => updateUser(null));
      await handleLogout();
    }
  };

  const handleDeleteProfile = async () => {
    setDeleteInProgress(true);
    try {
      await api.delete('/users/me/delete/');
      setDeleteSuccess(true);
    } catch (error) {
      console.error('Error deleting profile:', error);
    }
    setDeleteInProgress(false);
  };

  const handleProfileImageChange = (newImageUrl: string | null) => {
    if (user) {
      updateUser({
        ...user,
        image: newImageUrl || user.image
      });
    }
  };

  const handleSaveName = async () => {
    setSavingName(true);
    try {
      const response = await api.put('/users/me/update/', {
        first_name: firstName,
        last_name: lastName,
      });
      
      // Update user context with the new data
      updateUser(response.data.user);
      setEditingName(false);
      setNotification({
        open: true,
        message: 'Name updated successfully!',
        isError: false
      });
    } catch (error) {
      console.error('Error updating name:', error);
      setNotification({
        open: true,
        message: 'Failed to update name. Please try again.',
        isError: true
      });
    }
    setSavingName(false);
  };

  const handleCancelEditName = () => {
    setFirstName(user?.first_name || '');
    setLastName(user?.last_name || '');
    setEditingName(false);
  };

  const handleChangePassword = async () => {
    // Validate passwords before submitting
    const passwordError = validatePassword(newPassword);
    const confirmError = validatePasswordMatch(newPassword, confirmPassword);
    
    if (passwordError || confirmError) {
      setNotification({
        open: true,
        message: passwordError || confirmError || 'Please check your password requirements.',
        isError: true
      });
      return;
    }

    setChangingPassword(true);
    try {
      await api.post('/users/me/change-password/', {
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      
      setChangePasswordOpen(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setNotification({
        open: true,
        message: 'Password changed successfully!',
        isError: false
      });
    } catch (error: any) {
      console.error('Error changing password:', error);
      const errorMessage = error.response?.data?.error || 'Failed to change password. Please try again.';
      setNotification({
        open: true,
        message: Array.isArray(errorMessage) ? errorMessage.join(' ') : errorMessage,
        isError: true
      });
    }
    setChangingPassword(false);
  };

  const handleCancelChangePassword = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setChangePasswordOpen(false);
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <Box sx={containerStyles}>
        <Typography variant="h4" gutterBottom>
          Settings
        </Typography>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  // Only show content if authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <Box sx={containerStyles}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Box sx={sectionStyles}>
        <Typography variant="h5" gutterBottom>
          Profile Settings
        </Typography>
        <Divider />
        
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mt: 3, gap: 4 }}>
          <ProfileImage
            imageSrc={user.image}
            username={user.username}
            width={120}
            height={120}
            showOptions={true}
            onImageChange={handleProfileImageChange}
          />
          
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              Welcome{user.first_name || user.last_name ? `, ${user.first_name} ${user.last_name}`.trim() : `, ${user.username}`}!
            </Typography>

            <Card sx={{ mt: 2, mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Personal Information
                </Typography>
                {editingName ? (
                  <Box>
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid size={6}>
                        <TextField
                          fullWidth
                          label="First Name"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          disabled={savingName}
                        />
                      </Grid>
                      <Grid size={6}>
                        <TextField
                          fullWidth
                          label="Last Name"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          disabled={savingName}
                        />
                      </Grid>
                    </Grid>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        onClick={handleSaveName}
                        disabled={savingName}
                      >
                        {savingName ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={handleCancelEditName}
                        disabled={savingName}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>First Name:</strong> {user.first_name || 'Not set'}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      <strong>Last Name:</strong> {user.last_name || 'Not set'}
                    </Typography>
                    <Button
                      variant="outlined"
                      onClick={() => setEditingName(true)}
                    >
                      Edit Name
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>

            <Card sx={{ mt: 2, mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Security
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Keep your account secure by using a strong password.
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => setChangePasswordOpen(true)}
                >
                  Change Password
                </Button>
              </CardContent>
            </Card>

            <Button
              variant="contained"
              color="error"
              onClick={handleClickOpen}
              sx={{ mt: 2 }}
            >
              Delete Account
            </Button>
          </Box>
        </Box>
      </Box>

      {user.is_superuser && (
        <Box sx={sectionStyles}>
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
                Are you sure you want to delete your profile, {user.first_name || user.username}?
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

      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onClose={handleCancelChangePassword} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          {changingPassword ? (
            <Box sx={{ width: '100%', my: 2 }}>
              <LinearProgress />
            </Box>
          ) : (
            <>
              <DialogContentText sx={{ mb: 2 }}>
                Enter your current password and choose a new secure password.
              </DialogContentText>
              <TextField
                autoFocus
                margin="dense"
                label="Current Password"
                type="password"
                fullWidth
                variant="outlined"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                disabled={changingPassword}
                sx={{ mb: 3 }}
              />
              <Box sx={{ mb: 2 }}>
                <PasswordField
                  password={newPassword}
                  setPassword={setNewPassword}
                  label="New Password"
                  showStrengthMeter={true}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <PasswordField
                  password={confirmPassword}
                  setPassword={setConfirmPassword}
                  label="Confirm New Password"
                  showStrengthMeter={false}
                />
              </Box>
              <Typography variant="caption" color="text.secondary">
                Password must contain at least 8 characters with uppercase, lowercase, and numbers.
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelChangePassword} disabled={changingPassword}>
            Cancel
          </Button>
          <Button
            onClick={handleChangePassword}
            disabled={changingPassword || !oldPassword || !newPassword || !confirmPassword}
            variant="contained"
          >
            {changingPassword ? 'Changing...' : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
