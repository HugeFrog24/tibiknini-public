import React, { useState, useEffect } from "react";
import { Button, Container, Col, FloatingLabel, Form, Row, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import api from '../utils/api';
import axios from 'axios';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import { REDIRECT_REASONS } from './constants/Constants';
import { showToast } from '../utils/toastUtils';

function SetupWizard() {
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [setupStatus, setSetupStatus] = useState({});
    const [statusFetched, setStatusFetched] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const checkSetupStatus = async () => {
            try {
                const response = await api.get('/setup/status/');
                const statusData = response.data;

                setSetupStatus(statusData);

                // Update currentStep based on setup status
                if (!statusData.database_configured) {
                    setCurrentStep(0);
                } else if (!statusData.superuser_exists) {
                    setCurrentStep(1);
                } else if (!statusData.site_title_set) {
                    setCurrentStep(2);
                }
            } catch (error) {
                // Handle the case where the status code is 503
                if (error.response && error.response.status === 503) {
                    // Setup is incomplete, determine which step to show
                    const statusData = error.response.data;
                    setSetupStatus(statusData);
                    if (!statusData.database_configured) {
                        setCurrentStep(0);
                    } else if (!statusData.superuser_exists) {
                        setCurrentStep(1);
                    } else if (!statusData.site_title_set) {
                        setCurrentStep(2);
                    }
                } else {
                    // Handle other errors or show a generic error message
                    showToast('Failed to fetch setup status.', 'error');
                }
            } finally {
                // Ensure loading is stopped and status is marked as fetched
                setIsLoading(false);
                setStatusFetched(true);
            }
        };

        checkSetupStatus();
    }, [navigate]);

    const steps = [
        {
            id: "db_config",
            title: "Database Configuration",
            description: "Enter your database connection details.",
            fields: [
                { id: "db_host", label: "Database Host", type: "text", placeholder: "Enter database host" },
                { id: "db_port", label: "Database Port", type: "number", placeholder: "Enter database port" },
                { id: "db_name", label: "Database Name", type: "text", placeholder: "Enter database name" },
                { id: "db_user", label: "Database User", type: "text", placeholder: "Enter database user" },
                { id: "db_password", label: "Database Password", type: "password", placeholder: "Enter database password" }
            ],
            validationSchema: Yup.object({
                db_host: Yup.string().required("Required"),
                db_port: Yup.number().required("Required"),
                db_name: Yup.string().required("Required"),
                db_user: Yup.string().required("Required"),
                db_password: Yup.string().required("Required")
            })
        },
        {
            id: "admin_user",
            title: "Admin User",
            description: "Create an admin user for the application (if one doesn't exist).",
            fields: [
                { id: "admin_username", label: "Admin Username", type: "text", placeholder: "Enter admin username" },
                { id: "admin_email", label: "Admin Email", type: "email", placeholder: "Enter admin email" },
                { id: "admin_password", label: "Admin Password", type: "password", placeholder: "Enter admin password" },
                { id: "admin_password2", label: "Confirm Password", type: "password", placeholder: "Confirm admin password" }
            ],
            validationSchema: Yup.object({
                admin_username: Yup.string().required("Required"),
                admin_email: Yup.string().email("Invalid email address").required("Required"),
                admin_password: Yup.string().min(8, "Password should be at least 8 characters").required("Required"),
                admin_password2: Yup.string().oneOf([Yup.ref("admin_password")], "Passwords must match").required("Required")
            })
        },
        {
            id: "site_info",
            title: "Site Information",
            description: "Enter the site title.",
            fields: [
                { id: "site_title", label: "Site Title", type: "text", placeholder: "Enter site title" }
            ],
            validationSchema: Yup.object({
                site_title: Yup.string().required("Required")
            })
        }
    ];

    const formik = useFormik({
        initialValues: {
            db_host: "",
            db_port: "",
            db_name: "",
            db_user: "",
            db_password: "",
            site_title: "",
            admin_username: "",
            admin_email: "",
            admin_password: "",
            admin_password2: ""
        },
        validateOnBlur: false,
        validateOnChange: false,
        onSubmit: async (values) => {
            setIsLoading(true);
            const currentFields = steps[currentStep].fields.map(f => f.id);
            const currentValidationSchema = steps[currentStep].validationSchema;
            let errors = {};
            currentFields.forEach(field => {
                try {
                    currentValidationSchema.validateSyncAt(field, values);
                } catch (err) {
                    errors[field] = err.message;
                }
            });
            formik.setErrors(errors);
            if (Object.keys(errors).length === 0) {
                if (currentStep === 0) {
                    try {
                        const response = await api.post('/setup/', {
                            db_host: values.db_host,
                            db_port: values.db_port,
                            db_name: values.db_name,
                            db_user: values.db_user,
                            db_password: values.db_password
                        });
                        showToast(response.data.detail, 'success');
                        setSetupStatus(response.data);
                        if (!response.data.superuser_exists) {
                            setCurrentStep(1);
                        } else if (!response.data.site_title_set) {
                            setCurrentStep(2);
                        } else {
                            navigate("/login", { state: { reason: 'SETUP_COMPLETE' } });
                        }
                    } catch (error) {
                        console.error("Error during database setup:", error);
                        showToast('An error occurred during database setup.', 'error');
                    }
                } else if (currentStep === 1) {
                    try {
                        const response = await api.post('/create-superuser/', {
                            admin_username: values.admin_username,
                            admin_email: values.admin_email,
                            admin_password: values.admin_password
                        });
                        showToast(response.data.detail, response.status === 201 ? 'success' : 'info');
                        setSetupStatus(response.data);
                        if (!response.data.site_title_set) {
                            setCurrentStep(2);
                        } else {
                            navigate("/login", { state: { reason: 'SETUP_COMPLETE' } });
                        }
                    } catch (error) {
                        console.error("Error during superuser creation:", error);
                        showToast('An error occurred during superuser creation.', 'error');
                    }
                } else if (currentStep === 2) {
                    try {
                        const response = await api.post('/setup/site-info/', {
                            site_title: values.site_title
                        });
                        showToast(response.data.detail, 'success');
                        setSetupStatus(response.data);
                        navigate("/login", { state: { reason: 'SETUP_COMPLETE' } });
                    } catch (error) {
                        console.error("Error during site info setup:", error);
                        showToast('An error occurred during site info setup.', 'error');
                    }
                }
            } else {
                let touchedFields = currentFields.reduce((acc, field) => {
                    acc[field] = true;
                    return acc;
                }, {});
                formik.setTouched(touchedFields);
            }
            setIsLoading(false);
        },
    });

    if (!statusFetched) {
        return (
            <div className="text-center mt-5">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </div>
        );
    }

    if (isLoading) {
        return <Spinner animation="border" />;
    }

    return (
        <Container>
            <Row className="justify-content-md-center">
                <Col xl={6} lg={6} md={6} sm={6}>
                    <h2>{steps[currentStep].title}</h2>
                    <p>{steps[currentStep].description}</p>
                    <Form onSubmit={formik.handleSubmit} noValidate>
                        {steps[currentStep].fields.map(field => (
                            <FloatingLabel controlId={field.id} label={field.label} className="mb-3" key={field.id}>
                                <Form.Control
                                    type={field.type}
                                    id={field.id}
                                    name={field.id}
                                    value={formik.values[field.id]}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    placeholder={field.placeholder}
                                    isInvalid={formik.errors[field.id] && formik.touched[field.id]}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {formik.errors[field.id]}
                                </Form.Control.Feedback>
                            </FloatingLabel>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            {currentStep > 0 && (
                                <Button type="button" onClick={() => setCurrentStep(step => step - 1)} style={{ marginRight: '10px' }}>
                                    Back
                                </Button>
                            )}
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : (currentStep < steps.length - 1 ? "Next" : "Finish")}
                            </Button>
                        </div>
                    </Form>
                </Col>
            </Row>
        </Container>
    );
}

export default SetupWizard;