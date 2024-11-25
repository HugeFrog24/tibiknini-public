export const REDIRECT_REASONS = {
    AUTH_REQUIRED: {
        message: 'You must be logged in to access this page.',
        type: 'warning'
    },
    AUTHENTICATED_ONLY: { message: 'Authenticated only', type: 'warning' },
    LIKE_POST: { message: 'Liked post', type: 'info' },
    CREATE_POST: { message: 'Created post', type: 'success' },
    EDIT_POST: { message: 'Edited post', type: 'info' },
    VIEW_OWN_PROFILE: { message: 'Viewing own profile', type: 'info' },
    FOLLOW_USER: { message: 'Followed user', type: 'info' },
    REGISTRATION_SUCCESSFUL: { message: 'Registration successful', type: 'success' },
    SETUP_COMPLETE: { message: 'Setup complete. Please login', type: 'success' }, // Updated reason
    PASSWORD_RESET_SUCCESS: {
        message: 'Your password has been reset successfully. Please log in with your new password.',
        type: 'success'
    },
    // Add more standardized reasons as needed
};