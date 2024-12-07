import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import React, { useState, useEffect } from "react";
import { Container, TextField, Button, CircularProgress, Typography, Box, styled, LinearProgress } from "@mui/material";
import { Stepper, Step, StepLabel, StepConnector, stepConnectorClasses, StepIconProps } from '@mui/material';
import { useNavigate } from '@remix-run/react';
import api from '../utils/api';
import { object, string, number, boolean, ref } from 'yup';
import { useFormik } from 'formik';
import { showToast } from '../utils/toastUtils';
import Check from '@mui/icons-material/Check';
import SettingsIcon from '@mui/icons-material/Settings';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import TitleIcon from '@mui/icons-material/Title';
import EmailIcon from '@mui/icons-material/Email';

// Types
interface SetupStatus {
    database_configured: boolean;
    superuser_exists: boolean;
    site_title_set: boolean;
    email_configured: boolean;
    status?: string;
    [key: string]: boolean | string | undefined;
}

interface Field {
    id: string;
    label: string;
    type: string;
    required?: boolean;
}

interface Step {
    id: string;
    title: string;
    description: string;
    fields: Field[];
    validationSchema: any;
    isComplete: (status: SetupStatus) => boolean;
}

interface FormValues {
    db_host: string;
    db_port: string;
    db_name: string;
    db_user: string;
    db_password: string;
    site_title: string;
    admin_username: string;
    admin_email: string;
    admin_password: string;
    admin_password2: string;
    smtp_host: string;
    smtp_port: string;
    smtp_username: string;
    smtp_password: string;
    smtp_from_email: string;
    smtp_use_tls: boolean;
}

// Styled components
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

interface ColorlibStepIconRootProps {
    ownerState: {
        completed?: boolean;
        active?: boolean;
    };
}

const ColorlibStepIconRoot = styled('div')<ColorlibStepIconRootProps>(({ theme, ownerState }) => ({
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

function ColorlibStepIcon(props: StepIconProps) {
    const { active, completed, className, icon } = props;

    const icons: { [index: string]: React.ReactElement } = {
        1: <SettingsIcon />,
        2: <GroupAddIcon />,
        3: <TitleIcon />,
        4: <EmailIcon />,
    };

    return (
        <ColorlibStepIconRoot ownerState={{ completed, active }} className={className}>
            {completed ? <Check /> : icons[String(icon)]}
        </ColorlibStepIconRoot>
    );
}

// Loader function for server-side checks
export async function loader({ request }: LoaderFunctionArgs) {
    try {
        const response = await fetch(`${process.env.API_URL}/api/setup/status/`);
        const data = await response.json();
        
        if (data.status === 'complete') {
            return redirect('/');
        }
        
        return json({ status: data.status });
    } catch (error) {
        return json({ status: 'error' });
    }
}

export default function SetupWizard() {
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [setupStatus, setSetupStatus] = useState<SetupStatus>({} as SetupStatus);
    const [statusFetched, setStatusFetched] = useState<boolean>(false);
    const [sendingTestEmail, setSendingTestEmail] = useState<boolean>(false);
    const navigate = useNavigate();

    const steps: Step[] = [
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
            validationSchema: object({
                db_host: string().required("Required"),
                db_port: number().required("Required"),
                db_name: string().required("Required"),
                db_user: string().required("Required"),
                db_password: string().required("Required")
            }),
            isComplete: (status: SetupStatus) => status.database_configured
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
            validationSchema: object({
                admin_username: string().required("Required"),
                admin_email: string().email("Invalid email address").required("Required"),
                admin_password: string().min(8, "Password should be at least 8 characters").required("Required"),
                admin_password2: string().oneOf([ref("admin_password")], "Passwords must match").required("Required")
            }),
            isComplete: (status: SetupStatus) => status.superuser_exists
        },
        {
            id: "site_info",
            title: "Site Information",
            description: "Enter the site title.",
            fields: [
                { id: "site_title", label: "Site Title", type: "text" }
            ],
            validationSchema: object({
                site_title: string().required("Required")
            }),
            isComplete: (status: SetupStatus) => status.site_title_set
        },
        {
            id: "email_config",
            title: "Email Configuration",
            description: "Configure your email (SMTP) settings.",
            fields: [
                { id: "smtp_host", label: "SMTP Host", type: "text", required: true },
                { id: "smtp_port", label: "SMTP Port", type: "number", required: true },
                { id: "smtp_username", label: "SMTP Username", type: "text", required: true },
                { id: "smtp_password", label: "SMTP Password", type: "password", required: true },
                { id: "smtp_from_email", label: "From Email", type: "email", required: true },
                { id: "smtp_use_tls", label: "Use TLS", type: "checkbox" }
            ],
            validationSchema: object({
                smtp_host: string().required("Required"),
                smtp_port: number().required("Required"),
                smtp_username: string().required("Required"),
                smtp_password: string().required("Required"),
                smtp_from_email: string().email("Invalid email address").required("Required"),
                smtp_use_tls: boolean()
            }),
            isComplete: (status: SetupStatus) => status.email_configured
        }
    ];

    // Function to find the next incomplete step
    const findNextIncompleteStep = (status: SetupStatus): number => {
        for (let i = 0; i < steps.length; i++) {
            if (!steps[i].isComplete(status)) {
                return i;
            }
        }
        return steps.length - 1;
    };

    // Function to check if all steps are complete
    const isSetupComplete = (status: SetupStatus): boolean => {
        return steps.every(step => step.isComplete(status));
    };

    useEffect(() => {
        const checkSetupStatus = async () => {
            try {
                const response = await api.get<SetupStatus>('/setup/status/');
                const statusData = response.data;
                setSetupStatus(statusData);
                
                // If all steps are complete, redirect to login
                if (isSetupComplete(statusData)) {
                    navigate("/login", { state: { reason: 'SETUP_COMPLETE' } });
                    return;
                }
                
                setCurrentStep(findNextIncompleteStep(statusData));
            } catch (error: any) {
                if (error.response && error.response.status === 503) {
                    const statusData = error.response.data;
                    setSetupStatus(statusData);
                    setCurrentStep(findNextIncompleteStep(statusData));
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

        // If all steps are complete, redirect to login
        if (isSetupComplete(setupStatus)) {
            navigate("/login", { state: { reason: 'SETUP_COMPLETE' } });
            return;
        }

        const nextIncompleteStep = findNextIncompleteStep(setupStatus);
        if (currentStep !== nextIncompleteStep) {
            setCurrentStep(nextIncompleteStep);
            const stepNames = ['database configuration', 'admin user creation', 'site information', 'email configuration'];
            showToast(`Redirected to ${stepNames[nextIncompleteStep]} - this step needs to be completed`, 'info');
        }
    }, [currentStep, setupStatus, statusFetched, navigate]);

    const formik = useFormik<FormValues>({
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
            admin_password2: "",
            smtp_host: "",
            smtp_port: "",
            smtp_username: "",
            smtp_password: "",
            smtp_from_email: "",
            smtp_use_tls: false
        },
        validateOnBlur: false,
        validateOnChange: false,
        onSubmit: async (values) => {
            setIsLoading(true);
            const currentFields = steps[currentStep].fields.map(f => f.id);
            const currentValidationSchema = steps[currentStep].validationSchema;
            let errors: { [key: string]: string } = {};
            
            currentFields.forEach(field => {
                try {
                    currentValidationSchema.validateSyncAt(field, values);
                } catch (err: any) {
                    errors[field] = err.message;
                }
            });
            
            formik.setErrors(errors);
            
            if (Object.keys(errors).length === 0) {
                try {
                    if (currentStep === 0) {
                        const response = await api.post('/setup/', {
                            db_host: values.db_host,
                            db_port: values.db_port,
                            db_name: values.db_name,
                            db_user: values.db_user,
                            db_password: values.db_password
                        });
                        showToast(response.data.detail, 'success');
                        setSetupStatus(response.data);
                    } else if (currentStep === 1) {
                        const response = await api.post('/create-superuser/', {
                            admin_username: values.admin_username,
                            admin_email: values.admin_email,
                            admin_password: values.admin_password
                        });
                        showToast(response.data.detail, response.status === 201 ? 'success' : 'info');
                        setSetupStatus(response.data);
                    } else if (currentStep === 2) {
                        const response = await api.post('/setup/site-info/', {
                            site_title: values.site_title
                        });
                        showToast(response.data.detail, 'success');
                        setSetupStatus(response.data);
                    } else if (currentStep === 3) {
                        const response = await api.post('/setup/email/', {
                            host: values.smtp_host,
                            port: values.smtp_port,
                            username: values.smtp_username,
                            password: values.smtp_password,
                            from_email: values.smtp_from_email,
                            use_tls: values.smtp_use_tls
                        });
                        showToast(response.data.detail, 'success');
                        setSetupStatus(response.data);
                        navigate("/login", { state: { reason: 'SETUP_COMPLETE' } });
                    }
                } catch (error) {
                    console.error("Error during setup:", error);
                    showToast('An error occurred during setup.', 'error');
                }
            } else {
                let touchedFields = currentFields.reduce((acc: { [key: string]: boolean }, field) => {
                    acc[field] = true;
                    return acc;
                }, {});
                formik.setTouched(touchedFields);
            }
            setIsLoading(false);
        },
    });

    const handleTestEmail = async () => {
        if (!formik.values.smtp_from_email) {
            showToast('Please enter your email address first', 'warning');
            return;
        }
        
        setSendingTestEmail(true);
        try {
            const response = await api.post('/setup/test-email/', {
                email: formik.values.smtp_from_email
            });
            showToast(response.data.detail, 'success');
        } catch (error: any) {
            console.error("Error sending test email:", error);
            showToast(error.response?.data?.detail || 'Failed to send test email', 'error');
        }
        setSendingTestEmail(false);
    };

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
                    {steps.map((step, index) => (
                        <Step key={step.id} completed={step.isComplete(setupStatus)}>
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
                                value={formik.values[field.id as keyof FormValues]}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                fullWidth
                                margin="normal"
                                error={Boolean(formik.errors[field.id as keyof FormValues] && formik.touched[field.id as keyof FormValues])}
                                helperText={formik.touched[field.id as keyof FormValues] && formik.errors[field.id as keyof FormValues]}
                                required={field.required}
                                disabled={isLoading}
                            />
                        ))}
                    </Box>

                    {currentStep === 3 && (
                        <Box mt={2} display="flex" justifyContent="center">
                            <Button
                                variant="outlined"
                                color="primary"
                                onClick={handleTestEmail}
                                disabled={sendingTestEmail || !formik.values.smtp_from_email}
                                startIcon={sendingTestEmail ? <CircularProgress size={20} /> : null}
                            >
                                {sendingTestEmail ? 'Sending...' : 'Send Test Email'}
                            </Button>
                        </Box>
                    )}

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
