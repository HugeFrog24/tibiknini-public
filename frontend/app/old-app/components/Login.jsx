import React, {useEffect, useRef, useState} from "react";
import { Container, Grid, Box } from '@mui/material';
import { useLocation, useNavigate } from '@remix-run/react';
import { TextField, Typography, Button, CircularProgress } from '@mui/material';

import config from "../config.json";
import { handleLogin } from '../utils/auth';
import { REDIRECT_REASONS } from './constants/Constants';
import { showToast } from '../utils/toastUtils';

import ReCAPTCHA from 'react-google-recaptcha';

export default function Login({onLogin, recaptchaSiteKey}) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [usernameInvalid, setUsernameInvalid] = useState(false);
    const [passwordInvalid, setPasswordInvalid] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const recaptchaRef = useRef(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const isUsernameInvalid = !username;
        const isPasswordInvalid = !password;

        setUsernameInvalid(isUsernameInvalid);
        setPasswordInvalid(isPasswordInvalid);

        if (isUsernameInvalid || isPasswordInvalid) {
            return;
        }

        // Execute reCAPTCHA check
        recaptchaRef.current.execute();
    };

    const handleRecaptcha = (token) => {
        handleLogin(
            username, 
            password, 
            token, 
            onLogin, 
            (to) => navigate(to, { state: location.state }), 
            setIsLoading
        );
    };

    useEffect(() => {
        if (location.state?.reason) {
            const reason = location.state.reason;
            if (reason && REDIRECT_REASONS[reason]) {
                const { message, type } = REDIRECT_REASONS[reason];
                showToast(message, type);
            }
        }
    }, [location]);

    return (
        <Container>
            <Grid container justifyContent="center">
                <Grid item xs={12} md={8} lg={3}>
                    <Typography variant="h4" component="h2" className="mb-3">Login</Typography>
                    <Box component="form" onSubmit={handleSubmit} noValidate>
                        <TextField
                            id="username"
                            label="Username"
                            variant="outlined"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            fullWidth
                            required
                            error={usernameInvalid}
                            helperText={usernameInvalid ? "Please fill your username." : ""}
                            className="mb-3"
                        />
                        <TextField
                            id="password"
                            label="Password"
                            type="password"
                            variant="outlined"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            fullWidth
                            required
                            error={passwordInvalid}
                            helperText={passwordInvalid ? "Please fill your password." : ""}
                            className="mb-3"
                            autoComplete="true"
                        />
                        <ReCAPTCHA
                            ref={recaptchaRef}
                            sitekey={recaptchaSiteKey}
                            size="invisible"
                            onChange={handleRecaptcha}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            className="shadow w-100 mb-3"
                            disabled={isLoading}
                            startIcon={isLoading ? <CircularProgress size="1rem" /> : null}
                        >
                            Login
                        </Button>
                        <Button
                            variant="outlined"
                            color="primary"
                            className="shadow w-100 mb-3"
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
                    </Box>
                </Grid>
            </Grid>
        </Container>
    );
}
