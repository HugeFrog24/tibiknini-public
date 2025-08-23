import { showToast } from '../utils/toastUtils';

// Message categories for better organization
export const MESSAGES = {
    TOAST: {
        PROFILE_IMAGE: {
            SIZE_ERROR: {
                message: 'Image size must be less than 2 MB',
                type: 'error' as const
            },
            TYPE_ERROR: {
                message: 'Please upload a valid image file (JPEG, PNG, GIF, or WebP)',
                type: 'error' as const
            },
            UPDATE_SUCCESS: {
                message: 'Profile image updated successfully',
                type: 'success' as const
            },
            UPDATE_ERROR: {
                message: 'Failed to update profile image',
                type: 'error' as const
            },
            REMOVE_SUCCESS: {
                message: 'Profile image removed successfully',
                type: 'success' as const
            },
            REMOVE_ERROR: {
                message: 'Failed to remove profile image',
                type: 'error' as const
            }
        },
        AUTH: {
            LOGIN_REQUIRED: {
                message: 'You must be logged in to access this page.',
                type: 'warning' as const
            },
            AUTHENTICATED_ONLY: {
                message: 'Authenticated only',
                type: 'warning' as const
            },
            REGISTRATION_SUCCESS: {
                message: 'Registration successful',
                type: 'success' as const
            },
            SETUP_COMPLETE: {
                message: 'Setup complete. Please login',
                type: 'success' as const
            },
            PASSWORD_RESET_SUCCESS: {
                message: 'Your password has been reset successfully. Please log in with your new password.',
                type: 'success' as const
            }
        },
        SETUP: {
            STATUS_ERROR: {
                message: 'Failed to fetch setup status.',
                type: 'error' as const
            },
            STEP_REDIRECT: {
                message: 'Redirected to {step} - this step needs to be completed',
                type: 'info' as const
            },
            EMAIL_REQUIRED: {
                message: 'Please enter your email address first',
                type: 'warning' as const
            },
            TEST_EMAIL_SUCCESS: {
                message: 'Test email sent successfully',
                type: 'success' as const
            },
            TEST_EMAIL_ERROR: {
                message: 'Failed to send test email',
                type: 'error' as const
            },
            GENERAL_ERROR: {
                message: 'An error occurred during setup.',
                type: 'error' as const
            },
            DATABASE_SUCCESS: {
                message: 'Database configuration saved successfully',
                type: 'success' as const
            },
            ADMIN_USER_SUCCESS: {
                message: 'Admin user created successfully',
                type: 'success' as const
            },
            SITE_INFO_SUCCESS: {
                message: 'Site information saved successfully',
                type: 'success' as const
            },
            EMAIL_CONFIG_SUCCESS: {
                message: 'Email configuration saved successfully',
                type: 'success' as const
            }
        },
        POST: {
            LIKE_SUCCESS: {
                message: 'Liked post',
                type: 'success' as const
            },
            CREATE_SUCCESS: {
                message: 'Created post',
                type: 'success' as const
            },
            EDIT_SUCCESS: {
                message: 'Edited post',
                type: 'success' as const
            },
            DELETE_ERROR: {
                message: 'Failed to delete post',
                type: 'error' as const
            },
            LIKE_ERROR: {
                message: 'Failed to like post',
                type: 'error' as const
            },
            UNLIKE_ERROR: {
                message: 'Failed to unlike post',
                type: 'error' as const
            }
        },
        USER: {
            VIEW_OWN_PROFILE: {
                message: 'Viewing own profile',
                type: 'info' as const
            },
            FOLLOW_SUCCESS: {
                message: 'Followed user',
                type: 'success' as const
            }
        },
        CLIPBOARD: {
            COPY_SUCCESS: {
                message: 'Link copied to clipboard!',
                type: 'success' as const
            }
        },
        SHARE: {
            COPY_SUCCESS: {
                message: 'Link copied to clipboard!',
                type: 'success' as const
            }
        }
    },
    REDIRECT: {
        AUTH_REQUIRED: {
            message: 'You must be logged in to access this page.',
            type: 'warning' as const
        },
        AUTHENTICATED_ONLY: {
            message: 'Authenticated only',
            type: 'warning' as const
        },
        LIKE_POST: {
            message: 'Liked post',
            type: 'info' as const
        },
        CREATE_POST: {
            message: 'Created post',
            type: 'success' as const
        },
        EDIT_POST: {
            message: 'Edited post',
            type: 'info' as const
        },
        VIEW_OWN_PROFILE: {
            message: 'Viewing own profile',
            type: 'info' as const
        },
        FOLLOW_USER: {
            message: 'Followed user',
            type: 'info' as const
        },
        REGISTRATION_SUCCESSFUL: {
            message: 'Registration successful',
            type: 'success' as const
        },
        SETUP_COMPLETE: {
            message: 'Setup complete. Please login',
            type: 'success' as const
        },
        PASSWORD_RESET_SUCCESS: {
            message: 'Your password has been reset successfully. Please log in with your new password.',
            type: 'success' as const
        }
    }
} as const;

export const ACTIONS = {
    REDIRECT: {
        EDIT_POST: 'EDIT_POST',
        NEW_POST: 'NEW_POST',
        PASSWORD_RESET_SUCCESS: 'password_reset_success',
        POST_DELETED: 'POST_DELETED'
    }
} as const;

// Type utilities
type ToastMessages = typeof MESSAGES.TOAST;
export type ToastCategory = keyof ToastMessages;
export type ToastMessageType<T extends ToastCategory> = keyof ToastMessages[T];
export type ToastMessageData = {
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
};

type ActionTypes = typeof ACTIONS.REDIRECT;
export type RedirectAction = keyof ActionTypes;

// Helper function to get toast message with proper type inference
export const getToastMessage = <T extends ToastCategory>(
    category: T,
    messageType: ToastMessageType<T>
): ToastMessageData => {
    const message = MESSAGES.TOAST[category][messageType];
    return message as ToastMessageData;
};

// Helper function to show toast with proper type inference
export const showToastMessage = <T extends ToastCategory>(
    category: T,
    messageType: ToastMessageType<T>,
    options?: Parameters<typeof showToast>[2]
): void => {
    const { message, type } = getToastMessage(category, messageType);
    showToast(message, type, options);
};

// Helper function to show toast with template string replacement
export const showToastMessageWithReplace = <T extends ToastCategory>(
    category: T,
    messageType: ToastMessageType<T>,
    replacements: Record<string, string>,
    options?: Parameters<typeof showToast>[2]
): void => {
    const { message, type } = getToastMessage(category, messageType);
    let finalMessage = message;
    Object.entries(replacements).forEach(([key, value]) => {
        finalMessage = finalMessage.replace(`{${key}}`, value);
    });
    showToast(finalMessage, type, options);
};

// Helper function for error toasts with fallback
export const showErrorToast = (
    error: unknown,
    fallbackMessage: string,
    options?: Parameters<typeof showToast>[2]
): void => {
    const message = error && typeof error === 'object' && 'response' in error &&
        error.response && typeof error.response === 'object' && 'data' in error.response &&
        error.response.data && typeof error.response.data === 'object' && 'error' in error.response.data ?
        error.response.data.error as string : fallbackMessage;
    showToast(message, 'error', options);
};

// Helper function to get redirect action with proper type inference
export const getRedirectAction = (action: RedirectAction): ActionTypes[RedirectAction] => {
    return ACTIONS.REDIRECT[action];
};
