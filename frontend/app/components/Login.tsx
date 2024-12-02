import * as React from 'react';
import type { FC, ChangeEvent } from "react";
import { Container, Grid } from '@mui/material';
import { useNavigate, Form, useSubmit } from '@remix-run/react';
import { TextField, Typography, Button, CircularProgress } from '@mui/material';
import ReCAPTCHA from 'react-google-recaptcha';

interface LoginProps {
    onLogin: () => void;
    recaptchaSiteKey: string;
}

export const Login: FC<LoginProps> = ({ recaptchaSiteKey }) => {
    const [username, setUsername] = React.useState<string>("");
    const [password, setPassword] = React.useState<string>("");
    const [usernameInvalid, setUsernameInvalid] = React.useState<boolean>(false);
    const [passwordInvalid, setPasswordInvalid] = React.useState<boolean>(false);
    const [isLoading, setIsLoading] = React.useState<boolean>(false);
    
    const navigate = useNavigate();
    const submit = useSubmit();
    const recaptchaRef = React.useRef<typeof ReCAPTCHA>(null);
    const formRef = React.useRef<HTMLFormElement>(null);

    const validateForm = (): boolean => {
        const isUsernameInvalid = !username;
        const isPasswordInvalid = !password;

        setUsernameInvalid(isUsernameInvalid);
        setPasswordInvalid(isPasswordInvalid);

        return !isUsernameInvalid && !isPasswordInvalid;
    };

    const handleSubmitClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        try {
            console.log('Executing ReCAPTCHA');
            const token = await recaptchaRef.current?.executeAsync();
            console.log('ReCAPTCHA token received:', token ? 'yes' : 'no');

            if (!token) {
                console.error('No ReCAPTCHA token received');
                setIsLoading(false);
                return;
            }

            if (formRef.current) {
                const formData = new FormData(formRef.current);
                formData.set('username', username);
                formData.set('password', password);
                formData.set('recaptcha', token); // Changed to match backend expectation

                console.log('Submitting form with data:', {
                    username,
                    recaptcha: 'present'
                });
                
                submit(formData, {
                    method: 'post',
                    action: '/login',
                });
            }
        } catch (error) {
            console.error('Error during form submission:', error);
            setIsLoading(false);
        }
    };

    const handleUsernameChange = (e: ChangeEvent<HTMLInputElement>) => {
        setUsername(e.target.value);
        if (usernameInvalid) setUsernameInvalid(false);
    };

    const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
        if (passwordInvalid) setPasswordInvalid(false);
    };

    return (
        <Container>
            <Grid container justifyContent="center">
                <Grid item xs={12} md={8} lg={3}>
                    <Typography variant="h4" component="h2" sx={{ mb: 3 }}>Login</Typography>
                    <Form ref={formRef} method="post">
                        <input type="hidden" name="recaptcha" value="" />
                        <TextField
                            id="username"
                            name="username"
                            label="Username"
                            variant="outlined"
                            value={username}
                            onChange={handleUsernameChange}
                            fullWidth
                            required
                            error={usernameInvalid}
                            helperText={usernameInvalid ? "Please fill your username." : ""}
                            sx={{ mb: 3 }}
                        />
                        <TextField
                            id="password"
                            name="password"
                            label="Password"
                            type="password"
                            variant="outlined"
                            value={password}
                            onChange={handlePasswordChange}
                            fullWidth
                            required
                            error={passwordInvalid}
                            helperText={passwordInvalid ? "Please fill your password." : ""}
                            sx={{ mb: 3 }}
                            autoComplete="current-password"
                        />
                        <ReCAPTCHA
                            ref={recaptchaRef}
                            sitekey={recaptchaSiteKey}
                            size="invisible"
                        />
                        <Button
                            onClick={handleSubmitClick}
                            variant="contained"
                            color="primary"
                            fullWidth
                            sx={{ mb: 3, boxShadow: 2 }}
                            disabled={isLoading}
                            startIcon={isLoading ? <CircularProgress size="1rem" /> : null}
                        >
                            {isLoading ? 'Logging in...' : 'Login'}
                        </Button>
                        <Button
                            variant="outlined"
                            color="primary"
                            fullWidth
                            sx={{ mb: 3, boxShadow: 2 }}
                            onClick={() => navigate("/register/")}
                        >
                            Register
                        </Button>
                        <Button
                            variant="text"
                            fullWidth
                            onClick={() => navigate('/forgot-password')}
                        >
                            Forgot Password?
                        </Button>
                    </Form>
                </Grid>
            </Grid>
        </Container>
    );
};

export default Login;
