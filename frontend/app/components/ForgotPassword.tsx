import * as React from 'react';
import type { ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { Container, Grid, Box, TextField, Typography, Button, CircularProgress } from '@mui/material';
import { showToast } from '../utils/toastUtils';
import api from '../utils/api';

interface ActionData {
  errors?: {
    email?: string;
  };
  success?: boolean;
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const email = formData.get("email") as string;

  if (!email) {
    return { errors: { email: "Please enter your email address." } };
  }

  try {
    await api.post('/users/password-reset/request/', { email });
    return { success: true };
  } catch (error) {
    return {
      errors: {
        email: error.response?.data?.error || 'Failed to process password reset request.'
      }
    };
  }
};

export default function ForgotPassword() {
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";

  if (actionData?.success) {
    return (
      <Container>
        <Grid container justifyContent="center">
          <Grid item xs={12} md={8} lg={4}>
            <Box>
              <Typography variant="h5" component="h2" sx={{ mb: 4 }}>
                Check Your Email
              </Typography>
              <Typography variant="body1" sx={{ mb: 4 }}>
                We've sent password reset instructions to your email address.
                Please check your inbox and follow the instructions to reset your password.
              </Typography>
              <Button
                variant="contained"
                component="a"
                href="/login"
                sx={{ mt: 3 }}
              >
                Return to Login
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Container>
    );
  }

  return (
    <Container>
      <Grid container justifyContent="center">
        <Grid item xs={12} md={8} lg={4}>
          <Box component={Form} method="post" noValidate>
            <Typography variant="h4" component="h2" sx={{ mb: 4 }}>
              Forgot Password
            </Typography>
            <Typography variant="body1" sx={{ mb: 4 }}>
              Enter your email address and we'll send you instructions to reset your password.
            </Typography>
            <TextField
              id="email"
              name="email"
              label="Email"
              type="email"
              variant="outlined"
              fullWidth
              required
              error={!!actionData?.errors?.email}
              helperText={actionData?.errors?.email}
              sx={{ mb: 4 }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={isLoading}
              sx={{ mb: 3 }}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Send Reset Instructions'}
            </Button>
            <Button
              variant="text"
              fullWidth
              component="a"
              href="/login"
            >
              Back to Login
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}
