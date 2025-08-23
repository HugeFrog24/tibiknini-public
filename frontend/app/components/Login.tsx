import * as React from 'react';
import type { FC, ChangeEvent } from "react";
import { Container, Grid } from '@mui/material';
import { useNavigate } from 'react-router';
import { TextField, Typography, Button, CircularProgress } from '@mui/material';
import ReCAPTCHA from 'react-google-recaptcha';
import type { ReCAPTCHA as ReCAPTCHAType } from 'react-google-recaptcha';

interface LoginProps {
    onLogin: (username: string, password: string, recaptcha: string) => Promise<{ success: boolean }>;
    recaptchaSiteKey: string;
}

export const Login: FC<LoginProps> = ({ recaptchaSiteKey, onLogin }) => {
    const [username, setUsername] = React.useState<string>("");
    const [password, setPassword] = React.useState<string>("");
    const [usernameInvalid, setUsernameInvalid] = React.useState<boolean>(false);
    const [passwordInvalid, setPasswordInvalid] = React.useState<boolean>(false);
    const [isLoading, setIsLoading] = React.useState<boolean>(false);
    
    const navigate = useNavigate();
    const recaptchaRef = React.useRef<ReCAPTCHAType>(null);
    const [error, setError] = React.useState<string>("");

    const validateForm = (): boolean => {
        const isUsernameInvalid = !username;
        const isPasswordInvalid = !password;

        setUsernameInvalid(isUsernameInvalid);
        setPasswordInvalid(isPasswordInvalid);

        return !isUsernameInvalid && !isPasswordInvalid;
    };

    const handleSubmit = async (e: React.FormEvent | React.MouseEvent) => {
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

            console.log('Calling onLogin with data:', {
                username,
                recaptcha: 'present'
            });
            
            // Call the client-side login handler
            const result = await onLogin(username, password, token);
            if (result.success) {
                setIsLoading(false);
            }
            
        } catch (error) {
            console.error('Error during login:', error);
            setError(error instanceof Error ? error.message : 'Login failed');
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
                <Grid size={{ xs: 12, md: 8, lg: 3 }}>
                    <Typography variant="h4" component="h2" sx={{ mb: 3 }}>Login</Typography>
                    {error && (
                        <Typography color="error" sx={{ mb: 2 }}>
                            {error}
                        </Typography>
                    )}
                    <form onSubmit={handleSubmit}>
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
                            type="submit"
                            onClick={handleSubmit}
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
                    </form>
                </Grid>
            </Grid>
        </Container>
    );
};

export default Login;
