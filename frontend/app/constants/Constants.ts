type ToastType = 'success' | 'error' | 'info' | 'warning';

interface RedirectReason {
    message: string;
    type: ToastType;
}

interface RedirectReasons {
    [key: string]: RedirectReason;
}

export const REDIRECT_REASONS: RedirectReasons = {
    SESSION_EXPIRED: {
        message: 'Your session has expired. Please log in again.',
        type: 'info'
    },
    UNAUTHORIZED: {
        message: 'Please log in to access this page.',
        type: 'warning'
    },
    LOGGED_OUT: {
        message: 'You have been successfully logged out.',
        type: 'success'
    },
    REGISTRATION_SUCCESS: {
        message: 'Registration successful! Please log in.',
        type: 'success'
    },
    PASSWORD_RESET: {
        message: 'Password has been reset. Please log in with your new password.',
        type: 'success'
    }
};
