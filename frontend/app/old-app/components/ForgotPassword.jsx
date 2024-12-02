import React, { useState } from 'react';
import { Container, Grid, Box } from '@mui/material';
import { TextField, Typography, Button, CircularProgress } from '@mui/material';
import { useNavigate } from '@remix-run/react';
import { showToast } from '../utils/toastUtils';
import api from '../../utils/api';  // Updated import path to use new TypeScript version

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [emailInvalid, setEmailInvalid] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isEmailSent, setIsEmailSent] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            setEmailInvalid(true);
            return;
        }

        setIsLoading(true);

        try {
            await api.post('/users/password-reset/request/', { email });
            setIsEmailSent(true);
            showToast('Password reset instructions have been sent to your email.', 'success');
        } catch (error) {
            showToast(error.response?.data?.error || 'Failed to process password reset request.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (isEmailSent) {
        return (
            <Container>
                <Grid container justifyContent="center">
                    <Grid item xs={12} md={8} lg={4}>
                        <Box component="form" onSubmit={handleSubmit} noValidate>
                            <Typography variant="h5" component="h2" className="mb-4">
                                Check Your Email
                            </Typography>
                            <Typography variant="body1" className="mb-4">
                                We've sent password reset instructions to your email address.
                                Please check your inbox and follow the instructions to reset your password.
                            </Typography>
                            <Button
                                variant="contained"
                                onClick={() => navigate('/login')}
                                className="mt-3"
                            >
                                Return to Login
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </Container>
        );
    }

    return (
        <Container>
            <Grid container justifyContent="center">
                <Grid item xs={12} md={8} lg={4}>
                    <Box component="form" onSubmit={handleSubmit} noValidate>
                        <Typography variant="h4" component="h2" className="mb-4">
                            Forgot Password
                        </Typography>
                        <Typography variant="body1" className="mb-4">
                            Enter your email address and we'll send you instructions to reset your password.
                        </Typography>
                        <TextField
                            id="email"
                            label="Email"
                            type="email"
                            variant="outlined"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setEmailInvalid(false);
                            }}
                            fullWidth
                            required
                            error={emailInvalid}
                            helperText={emailInvalid ? "Please enter your email address." : ""}
                            className="mb-4"
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            disabled={isLoading}
                            className="mb-3"
                        >
                            {isLoading ? <CircularProgress size={24} /> : 'Send Reset Instructions'}
                        </Button>
                        <Button
                            variant="text"
                            fullWidth
                            onClick={() => navigate('/login')}
                        >
                            Back to Login
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </Container>
    );
}

export default ForgotPassword;
