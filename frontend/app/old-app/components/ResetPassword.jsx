import React, { useState } from 'react';
import { Container, Row, Col, Form } from 'react-bootstrap';
import { TextField, Typography, Button, CircularProgress } from '@mui/material';
import { useNavigate, useSearchParams } from '@remix-run/react';
import { showToast } from '../utils/toastUtils';
import api from '../utils/api';
import config from "../config.json";

function ResetPassword() {
    const [searchParams] = useSearchParams();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordInvalid, setPasswordInvalid] = useState(false);
    const [confirmPasswordInvalid, setConfirmPasswordInvalid] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const token = searchParams.get('token');

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate inputs
        let hasError = false;
        if (!newPassword) {
            setPasswordInvalid(true);
            hasError = true;
        }
        if (!confirmPassword) {
            setConfirmPasswordInvalid(true);
            hasError = true;
        }
        if (newPassword !== confirmPassword) {
            setConfirmPasswordInvalid(true);
            showToast('Passwords do not match.', 'error');
            hasError = true;
        }
        if (hasError) return;

        setIsLoading(true);

        try {
            await api.post('/users/password-reset/confirm/', {
                token,
                new_password: newPassword,
            });
            
            showToast('Password has been reset successfully.', 'success');
            navigate('/login', { state: { reason: 'password_reset_success' } });
        } catch (error) {
            showToast(error.response?.data?.error || 'Failed to reset password.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <Container>
                <Row className="justify-content-center">
                    <Col xs={12} md={8} lg={6} className="text-center">
                        <Typography variant="h5" component="h2" className="mb-4">
                            Invalid Reset Link
                        </Typography>
                        <Typography variant="body1" className="mb-4">
                            The password reset link is invalid or has expired.
                            Please request a new password reset.
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={() => navigate('/forgot-password')}
                            className="mt-3"
                        >
                            Request New Reset Link
                        </Button>
                    </Col>
                </Row>
            </Container>
        );
    }

    return (
        <Container>
            <Row className="justify-content-center">
                <Col xs={12} md={8} lg={4}>
                    <Typography variant="h4" component="h2" className="mb-4">
                        Reset Password
                    </Typography>
                    <Form onSubmit={handleSubmit} noValidate>
                        <TextField
                            id="new-password"
                            label="New Password"
                            type="password"
                            variant="outlined"
                            value={newPassword}
                            onChange={(e) => {
                                setNewPassword(e.target.value);
                                setPasswordInvalid(false);
                            }}
                            fullWidth
                            required
                            error={passwordInvalid}
                            helperText={passwordInvalid ? "Please enter your new password." : ""}
                            className="mb-3"
                        />
                        <TextField
                            id="confirm-password"
                            label="Confirm New Password"
                            type="password"
                            variant="outlined"
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                setConfirmPasswordInvalid(false);
                            }}
                            fullWidth
                            required
                            error={confirmPasswordInvalid}
                            helperText={confirmPasswordInvalid ? "Please confirm your new password." : ""}
                            className="mb-4"
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            disabled={isLoading}
                            className="mb-3"
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
                    </Form>
                </Col>
            </Row>
        </Container>
    );
}

export default ResetPassword;
