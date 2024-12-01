import React, { useRef, useState } from "react";
import { useNavigate } from '@remix-run/react';
import ReCAPTCHA from "react-google-recaptcha";
import { useFormik } from 'formik';
import { object, string, ref } from 'yup';
import {
  Box,
  Button,
  Container,
  Paper,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  Alert
} from "@mui/material";
import CelebrationIcon from '@mui/icons-material/Celebration';

import api from '../utils/api';

function RegistrationWizard() {
  const steps = [
    {
      id: "personal_details",
      label: "Personal Details",
      description: "Please fill in your personal details.",
      fields: [
        {
          id: "first_name",
          label: "First Name",
          type: "text",
        },
        {
          id: "last_name",
          label: "Last Name",
          type: "text",
        }
      ],
      validationSchema: object({
        first_name: string().trim().required("Required"),
        last_name: string().trim().required("Required")
      })
    },
    {
      id: "contact_details",
      label: "Contact Details",
      description: "Provide your contact information.",
      fields: [
        {
          id: "email",
          label: "Email Address",
          type: "email",
        }
      ],
      validationSchema: object({
        email: string().email("Invalid email address").required("Required")
      })
    },
    {
      id: "platform_representation",
      label: "Platform Representation",
      description: "Define how you'll appear to other users.",
      fields: [
        {
          id: "username",
          label: "Username",
          type: "text",
        },
        {
          id: "password",
          label: "Password",
          type: "password",
        },
        {
          id: "password2",
          label: "Confirm Password",
          type: "password",
        }
      ],
      validationSchema: object({
        username: string().trim().required("Required"),
        password: string().trim().min(8, "Password should be at least 8 characters").required("Required"),
        password2: string().oneOf([ref("password")], "Passwords must match").required("Required")
      })
    },
    {
      id: "success",
      label: "Welcome Aboard!",
      description: "",
      fields: [],
      validationSchema: object({})
    }
  ];

  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [skipped, setSkipped] = useState(new Set());
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);

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
      const currentFields = steps[activeStep].fields.map(f => f.id);
      const currentValidationSchema = steps[activeStep].validationSchema;
      try {
        await currentValidationSchema.validate(values, { abortEarly: false });
        if (activeStep === steps.length - 2) {
          recaptchaRef.current.execute();
        } else {
          handleNext();
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

  const finalizeRegistration = async (recaptchaToken) => {
    setIsSubmitting(true);
    try {
      await api.post('/users/register/', {
        ...formik.values,
        recaptcha: recaptchaToken
      });
      setErrorMessage(null);
      setRegistrationComplete(true);
      handleNext();
    } catch (error) {
      console.error("Error during registration:", error);
      if (error?.response?.data) {
        const errorData = error.response.data;
        let newFieldErrors = {};

        if (errorData.email) {
          newFieldErrors.email = errorData.email[0];
          setActiveStep(steps.findIndex(step => step.id === "contact_details"));
        }
        if (errorData.username) {
          newFieldErrors.username = errorData.username[0];
          setActiveStep(steps.findIndex(step => step.id === "platform_representation"));
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

  const isStepSkipped = (step) => {
    return skipped.has(step);
  };

  const handleNext = () => {
    let newSkipped = skipped;
    if (isStepSkipped(activeStep)) {
      newSkipped = new Set(newSkipped.values());
      newSkipped.delete(activeStep);
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped(newSkipped);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const currentStep = steps[activeStep];
  const currentFields = currentStep.fields;

  return (
    <Container component="main" maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((step, index) => {
            const stepProps = {};
            const labelProps = {};
            if (isStepSkipped(index)) {
              stepProps.completed = false;
            }
            return (
              <Step key={step.label} {...stepProps}>
                <StepLabel {...labelProps}>{step.label}</StepLabel>
              </Step>
            );
          })}
        </Stepper>

        <Box component="form" onSubmit={formik.handleSubmit} noValidate>
          {registrationComplete ? (
            <Box sx={{ textAlign: 'center' }}>
              <CelebrationIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h4" gutterBottom>
                Welcome aboard, {formik.values.first_name}!
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
                Please check your email to proceed with account verification.
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/login')}
                sx={{ minWidth: 200, textTransform: 'none' }}
              >
                Go to Login
              </Button>
            </Box>
          ) : (
            <>
              <Typography variant="h5" gutterBottom align="center">
                {activeStep === 2 && formik.values.first_name
                  ? `Welcome, ${formik.values.first_name}.`
                  : activeStep === 1 && formik.values.first_name
                    ? `Let's get your contact details, ${formik.values.first_name}.`
                    : currentStep.label}
              </Typography>

              <Typography variant="subtitle1" gutterBottom align="center" color="text.secondary">
                {currentStep.description}
              </Typography>

              {errorMessage && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errorMessage}
                </Alert>
              )}

              {currentFields.map((field) => (
                <TextField
                  key={field.id}
                  fullWidth
                  margin="normal"
                  id={field.id}
                  name={field.id}
                  label={field.label}
                  type={field.type}
                  value={formik.values[field.id]}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched[field.id] && Boolean(formik.errors[field.id])}
                  helperText={formik.touched[field.id] && formik.errors[field.id]}
                  autoComplete={field.type === "password" ? "new-password" : "off"}
                />
              ))}

              {currentStep.id === "platform_representation" && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 2 }}>
                  A strong password, known only to you, ensures your account's security and privacy.
                </Typography>
              )}

              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                size="invisible"
                onChange={(recaptchaToken) => finalizeRegistration(recaptchaToken)}
              />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <Button
                  color="inherit"
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  sx={{ mr: 1 }}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                >
                  {activeStep === steps.length - 2 ? (isSubmitting ? 'Submitting...' : 'Finish') : 'Next'}
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Paper>
    </Container>
  );
}

export default RegistrationWizard;
