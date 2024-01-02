import React, {useRef, useState} from "react";
import {Button, Container, Col, FloatingLabel, Form, Row} from "react-bootstrap";
import {useNavigate} from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import { useFormik } from 'formik';
import * as Yup from 'yup';

import api from '../utils/api';
import UseDarkMode from "../utils/UseDarkMode";
import {REDIRECT_REASONS} from "./constants/Constants";

function RegistrationWizard() {
    const steps = [
        {
            id: "personal_details",
            title: "Personal Details",
            description: "Please fill in your personal details.",
            fields: [
                {
                    id: "first_name",
                    label: "First Name",
                    type: "text",
                    placeholder: "Enter your first name",
                },
                {
                    id: "last_name",
                    label: "Last Name",
                    type: "text",
                    placeholder: "Enter your last name",
                }
            ],
            validationSchema: Yup.object({
                first_name: Yup.string().trim().required("Required"),
                last_name: Yup.string().trim().required("Required")
            })
        },
        {
            id: "contact_details",
            title: "Contact Details",
            description: "Provide your contact information.",
            fields: [
                {
                    id: "email",
                    label: "Email Address",
                    type: "email",
                    placeholder: "Enter your email",
                }
            ],
            validationSchema: Yup.object({
                email: Yup.string().email("Invalid email address").required("Required")
            })
        },
        {
            id: "platform_representation",
            title: "Platform Representation",
            description: "Define how you'll appear to other users.",
            fields: [
                {
                    id: "username_description",
                    type: "description",
                    content: "Select a unique username that best represents you."
                },
                {
                    id: "username",
                    label: "Username",
                    type: "text",
                    placeholder: "Choose a username",
                },
                {
                    id: "password_description",
                    type: "description",
                    content: "A strong password, known only to you, ensures your account's security and privacy."
                },
                {
                    id: "password",
                    label: "Password",
                    type: "password",
                    placeholder: "Enter a password",
                },
                {
                    id: "password2",
                    label: "Confirm Password",
                    type: "password",
                    placeholder: "Confirm your password",
                }
            ],
            validationSchema: Yup.object({
                username: Yup.string().trim().required("Required"),
                password: Yup.string().trim().min(8, "Password should be at least 8 characters").required("Required"),
                password2: Yup.string().oneOf([Yup.ref("password")], "Passwords must match").required("Required")
            })
        }
    ];

    const formik = useFormik({
        initialValues: {
            first_name: "",
            last_name: "",
            email: "",
            username: "",
            password: "",
            password2: ""
        },
        validateOnBlur: false,
        validateOnChange: false,
        onSubmit: async (values) => {
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
                    // If it's the final step, execute ReCAPTCHA
                    recaptchaRef.current.execute();
                } else {
                    // If not the final step, just move to the next step
                    setCurrentStep(step => step + 1);
                }
            } else {
                // When 'Next' is pressed, set ONLY the fields of the current step to "touched".
                let touchedFields = currentFields.reduce((acc, field) => {
                    acc[field] = true;
                    return acc;
                    }, {});
                formik.setTouched(touchedFields);
            }
        },
    });

    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const {bgClass, textClass} = UseDarkMode();
    const navigate = useNavigate();
    const recaptchaRef = useRef(null);
    
    const finalizeRegistration = async (recaptchaToken) => {
        setIsSubmitting(true);
        try {
            await api.post('/users/register/', {
                ...formik.values,
                recaptcha: recaptchaToken
            });
            setErrorMessage(null);
            navigate("/login", { state: { reason: REDIRECT_REASONS.REGISTRATION_SUCCESSFUL } });
        } catch (error) {
            console.error("Error during registration:", error);
            if (error && error.response && error.response.data) {
                const errorData = error.response.data;
    
                let newFieldErrors = {};

                if (errorData.email) {
                    newFieldErrors.email = errorData.email[0];
                    setCurrentStep(steps.findIndex(step => step.id === "contact_details"));
                } 
                if (errorData.username) {
                    newFieldErrors.username = errorData.username[0];
                    setCurrentStep(steps.findIndex(step => step.id === "platform_representation"));
                }

                formik.setErrors(newFieldErrors);
    
                if (errorData.non_field_errors) {
                    setErrorMessage(errorData.non_field_errors[0]);
                }
            } else {
                setErrorMessage("An unexpected error occurred during registration.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Container>
            <Row className="justify-content-md-center">
                <Col xl={6} lg={6} md={6} sm={6}>
                    <h2>
                        {steps[currentStep].id === "platform_representation" && formik.values.first_name
                            ? `Welcome, ${formik.values.first_name}.`
                            : steps[currentStep].id === "contact_details" && formik.values.first_name
                            ? `Let's get your contact details, ${formik.values.first_name}.`
                        : steps[currentStep].title}
                    </h2>
                    <p>{steps[currentStep].description}</p>
                    {errorMessage && <div className="alert alert-danger" role="alert">{errorMessage}</div>}
                    <Form onSubmit={formik.handleSubmit} noValidate>
                        {steps[currentStep].fields.map(field => (
                            <React.Fragment key={field.id}>
                                {field.type !== "description" ? (
                                    <FloatingLabel controlId={field.id} label={field.label} className="mb-3">
                                        {console.log(field.id, formik.errors[field.id], formik.touched[field.id])}
                                        <Form.Control
                                            type={field.type}
                                            id={field.id}
                                            name={field.id}
                                            value={formik.values[field.id]}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            placeholder={field.placeholder}
                                            className={`${bgClass} ${textClass} shadow ${formik.errors[field.id] && formik.touched[field.id] ? "is-invalid" : ""}`}
                                            autoComplete="off"
                                        />
                                        {formik.errors[field.id] && formik.touched[field.id] && (
                                            <Form.Control.Feedback type="invalid">
                                                {formik.errors[field.id]}
                                            </Form.Control.Feedback>
                                        )}
                                    </FloatingLabel>
                                ) : (
                                    <p className="text-start">{field.content}</p>
                                )}
                            </React.Fragment>
                            ))}
                        <ReCAPTCHA
                            ref={recaptchaRef}
                            sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY}
                            size="invisible"
                            onChange={(recaptchaToken) => finalizeRegistration(recaptchaToken)}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            {currentStep > 0 && (
                                <Button type="button" onClick={() => setCurrentStep(step => step - 1)} style={{ marginRight: '10px' }}>
                                    Back
                                </Button>
                                )}
                            <Button type="submit" disabled={isSubmitting}>
                               {currentStep < steps.length - 1 ? "Next" : (isSubmitting ? "Submitting..." : "Finish")}
                            </Button>
                        </div>
                    </Form>
                </Col>
            </Row>
        </Container>
        );
}

export default RegistrationWizard;
