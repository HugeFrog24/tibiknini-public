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
        CREATE_SUCCESS: 'Post created successfully!',
        UPDATE_SUCCESS: 'Post updated successfully!',
        DELETE_SUCCESS: 'Post deleted successfully!',
        CREATE_ERROR: 'An error occurred while creating the post. Please try again.',
        UPDATE_ERROR: 'An error occurred while updating the post. Please try again.',
        DELETE_ERROR: 'An error occurred while deleting the post. Please try again.',
        VALIDATION_ERROR: 'Please fill all fields before saving.',
        LOAD_ERROR: 'Failed to load the post for editing.'
    },
    COMMENT: {
        CREATE_SUCCESS: 'Comment created successfully!',
        UPDATE_SUCCESS: 'Comment updated successfully!',
        DELETE_SUCCESS: 'Comment deleted successfully!',
        CREATE_ERROR: 'An error occurred while creating the comment. Please try again.',
        UPDATE_ERROR: 'An error occurred while updating the comment. Please try again.',
        DELETE_ERROR: 'An error occurred while deleting the comment. Please try again.',
        VALIDATION_ERROR: 'Please enter a comment before submitting.',
        LOAD_ERROR: 'Failed to load comments.'
    },
    USER: {
        VIEW_OWN_PROFILE: 'Viewing own profile',
        FOLLOW_SUCCESS: 'Followed user'
    }
} as const;

// Type for accessing toast message keys
export type ToastMessageKey = keyof typeof TOAST_MESSAGES;
export type ToastSubMessageKey<T extends ToastMessageKey> = keyof typeof TOAST_MESSAGES[T];
