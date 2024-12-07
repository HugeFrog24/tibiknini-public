import * as React from 'react';
import { useState } from 'react';
import { 
    Box,
    Container,
    Typography,
    Button,
    CircularProgress,
    Stack
} from '@mui/material';
import { useNavigate, useSearchParams } from '@remix-run/react';
import { showToast } from '../utils/toastUtils';
import api from '../utils/api';
import { 
    PasswordValidation,
    validatePassword,
    validatePasswordMatch
} from '../utils/passwordValidation';

interface ResetPasswordFormData {
    token: string | null;
    new_password: string;
}

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const [newPassword, setNewPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [passwordError, setPasswordError] = useState<string>('');
    const [confirmPasswordError, setConfirmPasswordError] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const navigate = useNavigate();

    const token = searchParams.get('token');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Reset errors
        setPasswordError('');
        setConfirmPasswordError('');

        // Validate inputs
        const passwordValidationError = validatePassword(newPassword);
        const passwordMatchError = validatePasswordMatch(newPassword, confirmPassword);

        if (passwordValidationError) {
            setPasswordError(passwordValidationError);
            return;
        }

        if (passwordMatchError) {
            setConfirmPasswordError(passwordMatchError);
            return;
        }

        setIsLoading(true);

        try {
            const data: ResetPasswordFormData = {
                token,
                new_password: newPassword,
            };

            await api.post('/users/password-reset/confirm/', data);
            
            showToast('Password has been reset successfully.', 'success');
            navigate('/login', { state: { reason: 'password_reset_success' } });
        } catch (error: any) {
            showToast(error.response?.data?.error || 'Failed to reset password.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <Container maxWidth="sm">
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h5" component="h2" gutterBottom>
                        Invalid Reset Link
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 4 }}>
                        The password reset link is invalid or has expired.
                        Please request a new password reset.
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={() => navigate('/forgot-password')}
                    >
                        Request New Reset Link
                    </Button>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="sm">
            <Box sx={{ py: 4 }}>
                <Typography variant="h4" component="h2" gutterBottom>
                    Reset Password
                </Typography>
                <Box component="form" onSubmit={handleSubmit} noValidate>
                    <Stack spacing={3}>
                        <PasswordValidation
                            password={newPassword}
                            setPassword={setNewPassword}
                            confirmPassword={confirmPassword}
                            setConfirmPassword={setConfirmPassword}
                            passwordError={!!passwordError}
                            confirmPasswordError={!!confirmPasswordError}
                            passwordHelperText={passwordError}
                            confirmPasswordHelperText={confirmPasswordError}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            disabled={isLoading}
                        >
                            {isLoading ? <CircularProgress size={24} /> : 'Reset Password'}
                        </Button>
                        <Button
                            variant="text"
                            fullWidth
                            onClick={() => navigate('/login')}
                        >
                            Back to Login
                        </Button>
                    </Stack>
                </Box>
            </Box>
        </Container>
    );
}
