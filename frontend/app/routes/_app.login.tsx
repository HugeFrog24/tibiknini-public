import * as React from "react";
import { useLoaderData, useNavigate } from "react-router";
import Login from "../components/Login";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import UserContext from "../contexts/UserContext";
import api from "../utils/api";
import { isAxiosError } from "axios";

export async function loader() {
  const siteKey = process.env.VITE_RECAPTCHA_SITE_KEY;
  const nodeEnv = process.env.NODE_ENV;
  console.log('Environment:', nodeEnv);
  console.log('VITE_RECAPTCHA_SITE_KEY:', siteKey);
  
  if (!siteKey) {
    throw new Error('Missing VITE_RECAPTCHA_SITE_KEY environment variable');
  }
  
  return {
    RECAPTCHA_SITE_KEY: siteKey,
    ENV: nodeEnv,
  };
}

// Remove server-side action - login will be handled client-side

export default function LoginPage() {
  const data = useLoaderData<typeof loader>();
  const [isClient, setIsClient] = React.useState(false);
  const { updateUser } = React.useContext(UserContext);
  const navigate = useNavigate();
  
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  React.useEffect(() => {
    // Set the navigate function for the API utility
    api.setNavigate(navigate);
  }, [navigate]);

  const handleLogin = async (username: string, password: string, recaptcha: string) => {
    try {
      const response = await api.post('/auth/login/', {
        username,
        password,
        recaptcha,
      });

      // Update user context with the logged-in user
      updateUser(response.data.user);
      
      // Navigate to home page
      navigate('/');
      
      return { success: true };
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        throw new Error(error.response.data.detail || "Login failed");
      }
      throw new Error("Login failed. Please check your credentials.");
    }
  };
  
  if (!data.RECAPTCHA_SITE_KEY) {
    return (
      <div>
        <Typography color="error">
          Error: ReCAPTCHA configuration is missing. Environment: {data.ENV}
        </Typography>
      </div>
    );
  }
  
  // Only render the Login component on the client side
  if (!isClient) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </div>
    );
  }

  return (
    <Login
      recaptchaSiteKey={data.RECAPTCHA_SITE_KEY}
      onLogin={handleLogin}
    />
  );
}
