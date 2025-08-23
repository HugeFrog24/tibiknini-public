import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from 'react-router';
import ReCAPTCHA from "react-google-recaptcha";
import { useFormik } from 'formik';
import { object, string } from 'yup';
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
import { PasswordValidation, passwordValidationSchema } from '../utils/passwordValidation';

interface FormValues {
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  password: string;
  password2: string;
}

interface Field {
  id: keyof FormValues;
  label: string;
  type: string;
}

interface RegistrationStep {
  id: string;
  label: string;
  description: string;
  fields: Field[];
  validationSchema: any;
}

interface RegistrationWizardProps {
  recaptchaSiteKey: string;
}

export default function RegistrationWizard({ recaptchaSiteKey }: RegistrationWizardProps) {
  const [isBrowser, setIsBrowser] = useState(false);

  useEffect(() => {
    setIsBrowser(true);
  }, []);

  const steps: RegistrationStep[] = [
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
      description: "We'll use your email to keep you updated and secure your account.",
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
      description: "Choose a username and set up a secure password for your account. This is how other users will see you on the platform.",
      fields: [
        {
          id: "username",
          label: "Username",
          type: "text",
        }
      ],
      validationSchema: object({
        username: string().trim().required("Required"),
        ...passwordValidationSchema.fields
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

  const [activeStep, setActiveStep] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [skipped, setSkipped] = useState<Set<number>>(new Set());
  const [registrationComplete, setRegistrationComplete] = useState<boolean>(false);
  const navigate = useNavigate();
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const formik = useFormik<FormValues>({
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
          recaptchaRef.current?.execute();
        } else {
          handleNext();
        }
      } catch (err: any) {
        const errors: { [key: string]: string } = {};
        err.inner.forEach((error: any) => {
          errors[error.path] = error.message;
        });
        formik.setErrors(errors);
        formik.setTouched(
          currentFields.reduce((acc: { [key: string]: boolean }, field) => {
            acc[field] = true;
            return acc;
          }, {})
        );
      }
    },
  });

  const finalizeRegistration = async (recaptchaToken: string) => {
    setIsSubmitting(true);
    try {
      await api.post('/users/register/', {
        ...formik.values,
        recaptcha: recaptchaToken
      });
      setErrorMessage(null);
      setRegistrationComplete(true);
      handleNext();
    } catch (error: any) {
      console.error("Error during registration:", error);
      if (error?.response?.data) {
        const errorData = error.response.data;
        let newFieldErrors: { [key: string]: string } = {};

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

  const isStepSkipped = (step: number): boolean => {
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

  const renderFields = () => {
    if (currentStep.id === "platform_representation") {
      return (
        <>
          <TextField
            fullWidth
            margin="normal"
            id="username"
            name="username"
            label="Username"
            type="text"
            value={formik.values.username}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.username && Boolean(formik.errors.username)}
            helperText={formik.touched.username && formik.errors.username}
          />
          <PasswordValidation
            password={formik.values.password}
            setPassword={(value) => formik.setFieldValue('password', value)}
            confirmPassword={formik.values.password2}
            setConfirmPassword={(value) => formik.setFieldValue('password2', value)}
            passwordError={formik.touched.password && Boolean(formik.errors.password)}
            confirmPasswordError={formik.touched.password2 && Boolean(formik.errors.password2)}
            passwordHelperText={formik.touched.password ? formik.errors.password : ''}
            confirmPasswordHelperText={formik.touched.password2 ? formik.errors.password2 : ''}
          />
        </>
      );
    }

    return currentFields.map((field) => (
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
    ));
  };

  return (
    <Container component="main" maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((step, index) => {
            const stepProps: { completed?: boolean } = {};
            const labelProps: { optional?: React.ReactNode } = {};
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
                  ? `Ready, ${formik.values.first_name}?`
                  : activeStep === 1 && formik.values.first_name
                    ? `Hi ${formik.values.first_name}`
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

              {renderFields()}

              {isBrowser && (
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={recaptchaSiteKey}
                  size="invisible"
                  onChange={(recaptchaToken) => recaptchaToken && finalizeRegistration(recaptchaToken)}
                />
              )}

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
