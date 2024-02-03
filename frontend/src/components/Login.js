import React, {useEffect, useRef, useState} from "react";
import {Button, Col, Container, FloatingLabel, Form, Row} from "react-bootstrap";
import {toast} from "react-toastify";
import {useLocation, useNavigate} from "react-router-dom";
import { Helmet } from 'react-helmet-async';
import ReCAPTCHA from "react-google-recaptcha";

import config from "../config.json";
import FetchUser from "../utils/FetchUser";
import { useDarkMode } from './contexts/DarkModeContext';
import api from '../utils/api';
import { handleLogin } from '../utils/auth';
import {TOAST_MESSAGES} from './constants/Strings';

import Spinner from "react-bootstrap/Spinner";

function Login({onLogin}) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [usernameInvalid, setUsernameInvalid] = useState(false);
    const [passwordInvalid, setPasswordInvalid] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { modeClasses } = useDarkMode();
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
        handleLogin(username, password, token, onLogin, navigate, setIsLoading);
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
                    <h2 className="mb-3">Login</h2>
                    <Form onSubmit={handleSubmit}>
                        <FloatingLabel controlId="username" label="Username" className="mb-3">
                            <Form.Control
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className={`${modeClasses.bgClass} ${modeClasses.textClass} shadow`}
                                placeholder="Enter your username"
                                autoComplete="username"
                                isInvalid={usernameInvalid}
                            />
                            <Form.Control.Feedback type="invalid">Please fill your username.</Form.Control.Feedback>
                        </FloatingLabel>
                        <FloatingLabel controlId="password" label="Password" className="mb-3">
                            <Form.Control
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`${modeClasses.bgClass} ${modeClasses.textClass} shadow`}
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                isInvalid={passwordInvalid}
                            />
                            <Form.Control.Feedback type="invalid">Please fill your password.</Form.Control.Feedback>
                        </FloatingLabel>
                        <ReCAPTCHA
                            ref={recaptchaRef}
                            sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY}
                            size="invisible"
                            onChange={handleRecaptcha}
                        />
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
                        <Button
                            variant="outline-primary"
                            className="shadow w-100 mt-3"
                            onClick={() => navigate("/register/")}
                            >
                            Register
                        </Button>
                    </Form>
                </Col>
            </Row>
        </Container>
    );
}

export default Login;
