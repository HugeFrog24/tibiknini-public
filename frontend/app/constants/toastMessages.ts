export const TOAST_MESSAGES = {
    PROFILE_IMAGE: {
        SIZE_ERROR: 'Image size must be less than 2 MB',
        TYPE_ERROR: 'Please upload a valid image file (JPEG, PNG, GIF, or WebP)',
        UPDATE_SUCCESS: 'Profile image updated successfully',
        UPDATE_ERROR: 'Failed to update profile image',
        REMOVE_SUCCESS: 'Profile image removed successfully',
        REMOVE_ERROR: 'Failed to remove profile image'
    },
    AUTH: {
        LOGIN_REQUIRED: 'You must be logged in to access this page.',
        AUTHENTICATED_ONLY: 'Authenticated only',
        REGISTRATION_SUCCESS: 'Registration successful',
        SETUP_COMPLETE: 'Setup complete. Please login',
        PASSWORD_RESET_SUCCESS: 'Your password has been reset successfully. Please log in with your new password.'
    },
    POST: {
        LIKE_SUCCESS: 'Liked post',
        CREATE_SUCCESS: 'Created post',
        EDIT_SUCCESS: 'Edited post'
    },
    USER: {
        VIEW_OWN_PROFILE: 'Viewing own profile',
        FOLLOW_SUCCESS: 'Followed user'
    }
} as const;

// Type for accessing toast message keys
export type ToastMessageKey = keyof typeof TOAST_MESSAGES;
export type ToastSubMessageKey<T extends ToastMessageKey> = keyof typeof TOAST_MESSAGES[T];
