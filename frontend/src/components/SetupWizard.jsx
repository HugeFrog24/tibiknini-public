import React, { useState, useEffect } from "react";
import { Button, Container, Col, FloatingLabel, Form, Row, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import api from '../utils/api';
import axios from 'axios'; // Add this import
import * as Yup from 'yup';
import { useFormik } from 'formik';
import { REDIRECT_REASONS } from './constants/Constants';
import { showToast } from '../utils/toastUtils';

function SetupWizard() {
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const checkSetupStatus = async () => {
            try {
                await api.get('/setup/status/');
                // If we reach here, it means setup is incomplete (503 status)
                setIsLoading(false);
            } catch (error) {
                if (error.response && error.response.status === 503) { // Change this line
                    // Setup is incomplete, stop loading
                    setIsLoading(false);
                } else {
                    showToast('An error occurred while checking setup status.', 'error');
                    navigate('/');
                }
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
            description: "Create an admin user for the application.",
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
        }
    ];

    const formik = useFormik({
        initialValues: {
            db_host: "",
            db_port: "",
            db_name: "",
            db_user: "",
            db_password: "",
            admin_username: "",
            admin_email: "",
            admin_password: "",
            admin_password2: ""
        },
        validateOnBlur: false,
        validateOnChange: false,
        onSubmit: async (values) => {
            setIsLoading(true); // Start loading
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
                if (currentStep === steps.length - 1) {
                    try {
                        await api.post('/setup/', values);
                        navigate("/login", { state: { reason: REDIRECT_REASONS.SETUP_COMPLETE } }); // Navigate to login with reason
                    } catch (error) {
                        console.error("Error during setup:", error);
                    }
                } else {
                    setCurrentStep(step => step + 1);
                }
            } else {
                let touchedFields = currentFields.reduce((acc, field) => {
                    acc[field] = true;
                    return acc;
                }, {});
                formik.setTouched(touchedFields);
            }
            setIsLoading(false); // Stop loading
        },
    });

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