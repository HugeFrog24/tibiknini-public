import type { FormEvent, ChangeEvent } from 'react';
import React, { useState } from 'react';
import { Form, useNavigation } from '@remix-run/react';
import { Container, Grid } from '@mui/material';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { Send as SendIcon } from '@mui/icons-material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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

export default function Contact(): React.ReactElement {
  const navigation = useNavigation();
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
    if (!validateForm()) {
      event.preventDefault();
      return;
    }
  };

  return (
    <>
      <ToastContainer />
      <Container>
        <Grid container justifyContent="center">
          <Grid item xs={12} md={8} lg={6}>
            <Typography variant="h4" component="h2" sx={{ mt: 2 }}>
              Contact
            </Typography>
            <Typography variant="body1" sx={{ mb: 4 }}>
              If you have any questions, comments, or concerns, please feel free to reach out to us using the form below. 
              We look forward to hearing from you!
            </Typography>
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
                error={invalidFields.name}
                helperText={invalidFields.name ? "Please fill your name." : ""}
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
                error={invalidFields.email}
                helperText={invalidFields.email ? 
                  (formData.email && !/\S+@\S+\.\S+/.test(formData.email) 
                    ? 'Invalid email address.' 
                    : 'Email is required.'
                  ) : ""
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
                error={invalidFields.subject}
                helperText={invalidFields.subject ? "Please fill the subject." : ""}
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
                error={invalidFields.message}
                helperText={invalidFields.message ? "Please fill the message." : ""}
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
    </>
  );
}
