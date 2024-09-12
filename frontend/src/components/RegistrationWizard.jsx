import React, {useRef, useState} from "react";
import {useNavigate} from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Button,
  Container,
  TextField,
  Typography,
  Box,
  Alert,
  Step,
  StepLabel,
  Stepper,
  Divider
} from "@mui/material";

import api from '../utils/api';
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
                    id: "username",
                    label: "Username",
                    type: "text",
                    placeholder: "Choose a username",
                },
                {
                    id: "username_description",
                    type: "description",
                    content: "Select a unique username that best represents you."
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
                },
                {
                    id: "password_description",
                    type: "description",
                    content: "A strong password, known only to you, ensures your account's security and privacy."
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
            try {
                await currentValidationSchema.validate(values, { abortEarly: false });
                if (currentStep === steps.length - 1) {
                    recaptchaRef.current.execute();
                } else {
                    setCurrentStep(step => step + 1);
                }
            } catch (err) {
                const errors = {};
                err.inner.forEach(error => {
                    errors[error.path] = error.message;
                });
                formik.setErrors(errors);
                formik.setTouched(currentFields.reduce((acc, field) => {
                    acc[field] = true;
                    return acc;
                }, {}));
            }
        },
    });

    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
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
        <Container maxWidth="sm">
            <Box mt={4} mb={4}>
                <Stepper activeStep={currentStep}>
                    {steps.map((step) => (
                        <Step key={step.id}>
                            <StepLabel>{step.title}</StepLabel>
                        </Step>
                    ))}
                </Stepper>
                
                <Typography variant="h4" align="center" gutterBottom>
                    {steps[currentStep].id === "platform_representation" && formik.values.first_name
                        ? `Welcome, ${formik.values.first_name}.`
                        : steps[currentStep].id === "contact_details" && formik.values.first_name
                        ? `Let's get your contact details, ${formik.values.first_name}.`
                        : steps[currentStep].title}
                </Typography>
                <Typography variant="subtitle1" align="center" component="p">
                    {steps[currentStep].description}
                </Typography>
                {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
                <form onSubmit={formik.handleSubmit} noValidate>
                    {steps[currentStep].fields.map(field => (
                        <React.Fragment key={field.id}>
                            {field.type !== "description" && field.id !== "password" && field.id !== "password2" && (
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    margin="normal"
                                    id={field.id}
                                    name={field.id}
                                    label={field.label}
                                    type={field.type}
                                    value={formik.values[field.id]}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    error={formik.touched[field.id] && !!formik.errors[field.id]}
                                    helperText={formik.touched[field.id] && formik.errors[field.id]}
                                    autoComplete="off"
                                />
                            )}
                            {field.id === "username_description" && (
                                <>
                                    <Typography variant="body1" component="p" sx={{ mt: 2 }}>{field.content}</Typography>
                                    <Divider sx={{ my: 2 }} />
                                </>
                            )}
                        </React.Fragment>
                    ))}
                    {steps[currentStep].id === "platform_representation" && (
                        <>
                            <TextField
                                fullWidth
                                variant="outlined"
                                margin="normal"
                                id="password"
                                name="password"
                                label="Password"
                                type="password"
                                value={formik.values.password}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.password && !!formik.errors.password}
                                helperText={formik.touched.password && formik.errors.password}
                                autoComplete="off"
                            />
                            <TextField
                                fullWidth
                                variant="outlined"
                                margin="normal"
                                id="password2"
                                name="password2"
                                label="Confirm Password"
                                type="password"
                                value={formik.values.password2}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.password2 && !!formik.errors.password2}
                                helperText={formik.touched.password2 && formik.errors.password2}
                                autoComplete="off"
                            />
                            <Typography variant="body1" component="p" sx={{ mt: 2 }}>
                                A strong password, known only to you, ensures your account's security and privacy.
                            </Typography>
                        </>
                    )}
                    <ReCAPTCHA
                        ref={recaptchaRef}
                        sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                        size="invisible"
                        onChange={(recaptchaToken) => finalizeRegistration(recaptchaToken)}
                    />
                    <Box display="flex" justifyContent="space-between" mt={2}>
                        {currentStep > 0 && (
                            <Button onClick={() => setCurrentStep(step => step - 1)}>
                                Back
                            </Button>
                        )}
                        <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
                            {currentStep < steps.length - 1 ? "Next" : (isSubmitting ? "Submitting..." : "Finish")}
                        </Button>
                    </Box>
                </form>
            </Box>
        </Container>
    );
}

export default RegistrationWizard;
