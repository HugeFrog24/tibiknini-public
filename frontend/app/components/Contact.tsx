import type { FormEvent, ChangeEvent } from 'react';
import React, { useState } from 'react';
import type { ActionFunctionArgs } from 'react-router';
import { Form, useNavigation, useActionData } from 'react-router';
import { Container, Grid } from '@mui/material';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { Send as SendIcon } from '@mui/icons-material';
import { ToastContainer } from 'react-toastify';
import api from '../utils/api';

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface ValidationState {
  name: boolean;
  email: boolean;
  subject: boolean;
  message: boolean;
}

interface ActionData {
  errors?: {
    name?: string;
    email?: string;
    subject?: string;
    message?: string;
    general?: string;
  };
  success?: boolean;
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const subject = formData.get("subject") as string;
  const message = formData.get("message") as string;

  // Validation
  const errors: ActionData['errors'] = {};
  
  if (!name) {
    errors.name = "Please fill your name.";
  }
  
  if (!email) {
    errors.email = "Email is required.";
  } else if (!/\S+@\S+\.\S+/.test(email)) {
    errors.email = "Invalid email address.";
  }
  
  if (!subject) {
    errors.subject = "Please fill the subject.";
  }
  
  if (!message) {
    errors.message = "Please fill the message.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  try {
    // Send contact form data to backend
    await api.post('/messages/contact/', {
      name,
      email,
      subject,
      message
    });
    
    return { success: true };
  } catch (error: any) {
    return {
      errors: {
        general: error.response?.data?.error || 'Failed to send message. Please try again.'
      }
    };
  }
};

export default function Contact(): React.ReactElement {
  const navigation = useNavigation();
  const actionData = useActionData<ActionData>();
  const isSubmitting = navigation.state === "submitting";

  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [invalidFields, setInvalidFields] = useState<ValidationState>({
    name: false,
    email: false,
    subject: false,
    message: false
  });

  const validateForm = (): boolean => {
    const newInvalidFields = {
      name: !formData.name,
      email: !formData.email || !/\S+@\S+\.\S+/.test(formData.email),
      subject: !formData.subject,
      message: !formData.message
    };

    setInvalidFields(newInvalidFields);
    return !Object.values(newInvalidFields).some(invalid => invalid);
  };

  const handleInputChange = (field: keyof ContactFormData) => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    
    // Clear validation error when user starts typing
    if (invalidFields[field]) {
      setInvalidFields(prev => ({
        ...prev,
        [field]: false
      }));
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    // Let React Router handle the submission, but prevent if client-side validation fails
    if (!validateForm()) {
      event.preventDefault();
      return;
    }
  };

  // Show success message if form was submitted successfully
  if (actionData?.success) {
    return (
      <>
        <ToastContainer />
        <Container>
          <Grid container justifyContent="center">
            <Grid size={{ xs: 12, md: 8, lg: 6 }}>
              <Typography variant="h4" component="h2" sx={{ mt: 2 }}>
                Message Sent!
              </Typography>
              <Typography variant="body1" sx={{ mb: 4 }}>
                Thank you for contacting us! We've received your message and will get back to you as soon as possible.
              </Typography>
              <Button
                variant="contained"
                component="a"
                href="/"
                sx={{ mt: 3 }}
              >
                Return to Home
              </Button>
            </Grid>
          </Grid>
        </Container>
      </>
    );
  }

  return (<>
    <ToastContainer />
    <Container>
      <Grid container justifyContent="center">
        <Grid size={{ xs: 12, md: 8, lg: 6 }}>
          <Typography variant="h4" component="h2" sx={{ mt: 2 }}>
            Contact
          </Typography>
          <Typography variant="body1" sx={{ mb: 4 }}>
            If you have any questions, comments, or concerns, please feel free to reach out to us using the form below.
            We look forward to hearing from you!
          </Typography>
          {actionData?.errors?.general && (
            <Typography variant="body2" color="error" sx={{ mb: 2 }}>
              {actionData.errors.general}
            </Typography>
          )}
          <Form method="post" onSubmit={handleSubmit} noValidate>
            <TextField
              id="name"
              name="name"
              label="Name"
              variant="outlined"
              value={formData.name}
              onChange={handleInputChange('name')}
              fullWidth
              required
              error={invalidFields.name || !!actionData?.errors?.name}
              helperText={actionData?.errors?.name || (invalidFields.name ? "Please fill your name." : "")}
              sx={{ mb: 3 }}
            />
            <TextField
              id="email"
              name="email"
              label="Email address"
              variant="outlined"
              value={formData.email}
              onChange={handleInputChange('email')}
              fullWidth
              required
              error={invalidFields.email || !!actionData?.errors?.email}
              helperText={actionData?.errors?.email || (invalidFields.email ?
                (formData.email && !/\S+@\S+\.\S+/.test(formData.email)
                  ? 'Invalid email address.'
                  : 'Email is required.'
                ) : "")
              }
              sx={{ mb: 3 }}
            />
            <TextField
              id="subject"
              name="subject"
              label="Subject"
              variant="outlined"
              value={formData.subject}
              onChange={handleInputChange('subject')}
              fullWidth
              required
              error={invalidFields.subject || !!actionData?.errors?.subject}
              helperText={actionData?.errors?.subject || (invalidFields.subject ? "Please fill the subject." : "")}
              sx={{ mb: 3 }}
            />
            <TextField
              id="message"
              name="message"
              label="Message"
              variant="outlined"
              value={formData.message}
              onChange={handleInputChange('message')}
              fullWidth
              required
              multiline
              rows={4}
              error={invalidFields.message || !!actionData?.errors?.message}
              helperText={actionData?.errors?.message || (invalidFields.message ? "Please fill the message." : "")}
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} /> : <SendIcon />}
            >
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </Button>
          </Form>
        </Grid>
      </Grid>
    </Container>
  </>);
}
