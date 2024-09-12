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
    // Add more standardized reasons as needed
};