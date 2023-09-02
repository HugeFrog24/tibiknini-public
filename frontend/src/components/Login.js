import React, {useContext, useEffect, useState} from "react";
import axios from "axios";
import {Button, Col, Container, FloatingLabel, Form, Row} from "react-bootstrap";
import {toast} from "react-toastify";
import {useLocation, useNavigate} from "react-router-dom";
import { Helmet } from 'react-helmet-async';

import config from "../config.json";
import {SetAccessToken, SetRefreshToken} from "../utils/AccessToken";
import FetchUser from "../utils/FetchUser";
import UseDarkMode from "../utils/UseDarkMode";
import {TOAST_MESSAGES} from './constants/Strings';

import ApiUrlContext from "./contexts/ApiUrlContext";
import Spinner from "react-bootstrap/Spinner";

function Login({onLogin}) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [usernameInvalid, setUsernameInvalid] = useState(false);
    const [passwordInvalid, setPasswordInvalid] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const apiUrl = useContext(ApiUrlContext);
    const {bgClass, textClass} = UseDarkMode();
    const location = useLocation();
    const navigate = useNavigate();
    const handleSubmit = async (e) => {
        e.preventDefault();

        const isUsernameInvalid = !username;
        const isPasswordInvalid = !password;

        setUsernameInvalid(isUsernameInvalid);
        setPasswordInvalid(isPasswordInvalid);

        if (isUsernameInvalid || isPasswordInvalid) {
            return;
        }

        setIsLoading(true);  // Set loading to true when login process starts

        try {
            const response = await axios.post(`${apiUrl}/auth/token/`, {
                username,
                password
            });

            const data = response.data;
            SetAccessToken(data.access);
            SetRefreshToken(data.refresh);
            await FetchUser(apiUrl, onLogin);
            navigate("/"); // Redirect after login
        } catch (err) {
            if (err.response && err.response.status === 401) {
                // Authentication error
                toast.error('Invalid username or password.');
            } else if (!err.response) {
                // Network error or client is offline
                toast.error('Network error. Please check your internet connection.');
            } else {
                // Other server errors
                toast.error('An unexpected error occurred. Please try again later.');
            }
        } finally {
            setIsLoading(false);  // Reset loading to false once login process completes
        }
    };

    useEffect(() => {
        if (location.state && location.state.reason) {
            const message = TOAST_MESSAGES[location.state.reason];
            if (message) {
                toast.warning(message);
            }
        }
    }, [location]);

    return (
        <Container>
            <Helmet>
                <title>Login - {config.siteName}</title>
                <meta name="description" content={`Login to access your account on ${config.siteName}`} />
            </Helmet>
            <Row className="justify-content-center">
                <Col xs={12} md={8} lg={3}>
                    <h2 className="mt-2">Login</h2>
                    <Form onSubmit={handleSubmit}>
                        <FloatingLabel controlId="floatingInput" label="Username" className="mb-3">
                            <Form.Control
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className={`${bgClass} ${textClass} shadow`}
                                placeholder="Enter your username"
                                autoComplete="username"
                                isInvalid={usernameInvalid}
                            />
                            <Form.Control.Feedback type="invalid">Please fill your username.</Form.Control.Feedback>
                        </FloatingLabel>
                        <FloatingLabel controlId="floatingPassword" label="Password" className="mb-3">
                            <Form.Control
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`${bgClass} ${textClass} shadow`}
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                isInvalid={passwordInvalid}
                            />
                            <Form.Control.Feedback type="invalid">Please fill your password.</Form.Control.Feedback>
                        </FloatingLabel>
                        <Button
                            type="submit"
                            variant={isLoading ? "secondary" : "primary"}
                            className="shadow w-100" disabled={isLoading}
                        >
                            {
                                isLoading ?
                                    <Spinner
                                        as="span"
                                        animation="border"
                                        size="sm"
                                        role="status"
                                        aria-hidden="true"
                                    /> :
                                    "Login"
                            }
                        </Button>
                    </Form>
                </Col>
            </Row>
        </Container>
    );
}

export default Login;
