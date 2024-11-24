import api from './api';
import { toast } from 'react-toastify';

export const fetchUser = async () => {
    try {
        const response = await api.get('/users/me/');
        return response.data;
    } catch (error) {
        console.error('Error fetching user data:', error);
        throw error;
    }
};

export const handleLogin = async (
    username,
    password,
    recaptchaToken,
    onLoginSuccess,
    navigate,
    setLoading
) => {
    setLoading(true);
    try {
        const response = await api.post('/auth/login/', {
            username,
            password,
            recaptcha: recaptchaToken
        });

        if (response.status === 200) {
            const userData = await fetchUser();
            onLoginSuccess(userData);
            
            // Get the redirect path from storage or default to home
            const redirectTo = sessionStorage.getItem('redirectPath') || '/';
            sessionStorage.removeItem('redirectPath');
            
            navigate(redirectTo);
        }
    } catch (error) {
        const errorMessage = error.response?.data?.detail || 'Login failed. Please try again.';
        toast.error(errorMessage);
    } finally {
        setLoading(false);
    }
};

export const handleLogout = async (navigate) => {
    try {
        await api.post(`/auth/logout/`, {}, { withCredentials: true });
        navigate('/login');
    } catch (err) {
        console.error('Error during logout:', err);
        toast.error('An error occurred during logout. Please try again.');
    }
};