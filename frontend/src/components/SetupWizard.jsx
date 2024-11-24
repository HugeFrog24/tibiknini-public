import React, { useState, useEffect } from "react";
import { Container, TextField, Button, CircularProgress, Typography, Box, styled, LinearProgress } from "@mui/material";
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import StepConnector, { stepConnectorClasses } from '@mui/material/StepConnector';
import { useNavigate } from "react-router-dom";
import api from '../utils/api';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import { showToast } from '../utils/toastUtils';
import Check from '@mui/icons-material/Check';
import SettingsIcon from '@mui/icons-material/Settings';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import TitleIcon from '@mui/icons-material/Title';

// Custom connector styling
const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage: 'linear-gradient(95deg, #2196f3 0%, #1976d2 100%)',
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage: 'linear-gradient(95deg, #2196f3 0%, #1976d2 100%)',
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : '#eaeaf0',
    borderRadius: 1,
  },
}));

// Custom step icon styling
const ColorlibStepIconRoot = styled('div')(({ theme, ownerState }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : '#ccc',
  zIndex: 1,
  color: '#fff',
  width: 50,
  height: 50,
  display: 'flex',
  borderRadius: '50%',
  justifyContent: 'center',
  alignItems: 'center',
  ...(ownerState.active && {
    backgroundImage: 'linear-gradient(136deg, #2196f3 0%, #1976d2 100%)',
    boxShadow: '0 4px 10px 0 rgba(0,0,0,.25)',
  }),
  ...(ownerState.completed && {
    backgroundImage: 'linear-gradient(136deg, #2196f3 0%, #1976d2 100%)',
  }),
}));

// Custom step icon component
function ColorlibStepIcon(props) {
  const { active, completed, className } = props;

  const icons = {
    1: <SettingsIcon />,
    2: <GroupAddIcon />,
    3: <TitleIcon />,
  };

  return (
    <ColorlibStepIconRoot ownerState={{ completed, active }} className={className}>
      {completed ? <Check /> : icons[String(props.icon)]}
    </ColorlibStepIconRoot>
  );
}

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

                if (!statusData.database_configured) {
                    setCurrentStep(0);
                } else if (!statusData.superuser_exists) {
                    setCurrentStep(1);
                } else if (!statusData.site_title_set) {
                    setCurrentStep(2);
                }
            } catch (error) {
                if (error.response && error.response.status === 503) {
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
                    showToast('Failed to fetch setup status.', 'error');
                }
            } finally {
                setIsLoading(false);
                setStatusFetched(true);
            }
        };

        checkSetupStatus();
    }, [navigate]);

    useEffect(() => {
        if (!statusFetched) return;

        // Determine the required step based on setup status
        let requiredStep;
        if (!setupStatus.database_configured) {
            requiredStep = 0; // Database setup needed
        } else if (!setupStatus.superuser_exists) {
            requiredStep = 1; // Admin user needed
        } else if (!setupStatus.site_title_set) {
            requiredStep = 2; // Site title needed
        }

        // If we're on a step that's not required (either too early or too late), move to the required step
        if (requiredStep !== undefined && currentStep !== requiredStep) {
            setCurrentStep(requiredStep);
            const stepNames = ['database configuration', 'admin user creation', 'site information'];
            showToast(`Redirected to ${stepNames[requiredStep]} - this step needs to be completed`, 'info');
        }
    }, [currentStep, setupStatus, statusFetched]);

    const steps = [
        {
            id: "db_config",
            title: "Database Configuration",
            description: "Enter your database connection details.",
            fields: [
                { id: "db_host", label: "Database Host", type: "text", required: true },
                { id: "db_port", label: "Database Port", type: "number", required: true },
                { id: "db_name", label: "Database Name", type: "text", required: true },
                { id: "db_user", label: "Database User", type: "text", required: true },
                { id: "db_password", label: "Database Password", type: "password", required: true }
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
                { id: "admin_username", label: "Admin Username", type: "text", required: true },
                { id: "admin_email", label: "Admin Email", type: "email", required: true },
                { id: "admin_password", label: "Admin Password", type: "password", required: true },
                { id: "admin_password2", label: "Confirm Password", type: "password", required: true }
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
                { id: "site_title", label: "Site Title", type: "text" }
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
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container>
            <Box sx={{ width: '100%', mt: 4 }}>
                <Stepper alternativeLabel activeStep={currentStep} connector={<ColorlibConnector />}>
                    {steps.map((step) => (
                        <Step key={step.id}>
                            <StepLabel StepIconComponent={ColorlibStepIcon}>{step.title}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {isLoading && (
                    <Box sx={{ width: '100%', mt: 2 }}>
                        <LinearProgress />
                    </Box>
                )}

                <Box sx={{ mt: 4, mb: 2 }}>
                    <Typography variant="h4" component="h2" gutterBottom>
                        {steps[currentStep].title}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        {steps[currentStep].description}
                    </Typography>
                </Box>

                <form onSubmit={formik.handleSubmit} noValidate>
                    <Box sx={{ mb: 4 }}>
                        {steps[currentStep].fields.map(field => (
                            <TextField
                                key={field.id}
                                id={field.id}
                                name={field.id}
                                label={field.label}
                                type={field.type}
                                value={formik.values[field.id]}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                fullWidth
                                margin="normal"
                                error={formik.errors[field.id] && formik.touched[field.id]}
                                helperText={formik.touched[field.id] && formik.errors[field.id]}
                                required={field.required}
                                disabled={isLoading}
                            />
                        ))}
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                        {currentStep > 0 && (
                            <Button
                                variant="outlined"
                                onClick={() => setCurrentStep(step => step - 1)}
                                sx={{ mr: 1 }}
                                disabled={isLoading}
                            >
                                Back
                            </Button>
                        )}
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={isLoading}
                            sx={{ ml: 'auto' }}
                        >
                            {currentStep < steps.length - 1 ? "Next" : "Finish"}
                        </Button>
                    </Box>
                </form>
            </Box>
        </Container>
    );
}

export default SetupWizard;
