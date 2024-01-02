import api from './api';
import FetchUser from './FetchUser';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

export const handleLogin = async (username, password, recaptchaToken, onLogin, navigate, setIsLoading) => {
    setIsLoading(true);

    try {
        const response = await api.post(`/auth/login/`, {
            username,
            password,
            recaptcha: recaptchaToken
          }, {
            withCredentials: true
          });
        await FetchUser(onLogin);
        navigate("/"); // Redirect after login
      } catch (err) {
        console.error(err);
        if (err.response && err.response.status === 401) {
            // Authentication error
            toast.error('Invalid username or password.');
        } else if (!err.response) {
            // Network error or client is offline
            toast.error('Network error. Please check your internet connection.');
        } else {
            // Other server errors
            toast.error('An unexpected error occurred. Please try again later.');
        }
    } finally {
        setIsLoading(false);  // Reset loading to false once login process completes
    }
};

export const handleLogout = async () => {
    try {
        await api.post(`/auth/logout/`, {}, { withCredentials: true });
        // Handle successful logout, e.g. redirect to login page
    } catch (err) {
        // Handle errors
    }
};