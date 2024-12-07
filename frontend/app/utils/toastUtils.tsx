import React from 'react';
import { createRoot } from 'react-dom/client';
import { Alert, Snackbar, AlertColor } from '@mui/material';

type ToastType = AlertColor;

interface ToastOptions {
    autoHideDuration?: number;
    anchorOrigin?: {
        vertical: 'top' | 'bottom';
        horizontal: 'left' | 'center' | 'right';
    };
}

const defaultOptions: ToastOptions = {
    autoHideDuration: 5000,
    anchorOrigin: {
        vertical: 'top',
        horizontal: 'right',
    },
};

interface ToastComponentProps {
    message: string;
    type: ToastType;
    options: Required<ToastOptions>;
    onClose: () => void;
}

const ToastComponent: React.FC<ToastComponentProps> = ({ message, type, options, onClose }) => {
    return (
        <Snackbar
            open={true}
            autoHideDuration={options.autoHideDuration}
            onClose={onClose}
            anchorOrigin={options.anchorOrigin}
        >
            <Alert 
                onClose={onClose} 
                severity={type}
                variant="filled"
                sx={{ width: '100%' }}
            >
                {message}
            </Alert>
        </Snackbar>
    );
};

export const showToast = (message: string, type: ToastType, options: ToastOptions = {}): void => {
    const mergedOptions = { ...defaultOptions, ...options } as Required<ToastOptions>;
    
    // Create container for the toast if it doesn't exist
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    // Create a new div for this specific toast
    const toastDiv = document.createElement('div');
    container.appendChild(toastDiv);

    const root = createRoot(toastDiv);

    const handleClose = () => {
        root.unmount();
        toastDiv.remove();
        if (container?.childNodes.length === 0) {
            container.remove();
        }
    };

    root.render(
        <ToastComponent
            message={message}
            type={type}
            options={mergedOptions}
            onClose={handleClose}
        />
    );
};
