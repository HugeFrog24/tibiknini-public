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

export const handleLogin = async (username, password, recaptchaToken, onLogin, navigate, setIsLoading) => {
    setIsLoading(true);

    try {
        await api.post(`/auth/login/`, {
            username,
            password,
            recaptcha: recaptchaToken
        }, {
            withCredentials: true
        });
        const userData = await fetchUser();
        onLogin(userData);
        navigate("/");
    } catch (err) {
        console.error(err);
        if (err.response && err.response.status === 401) {
            toast.error('Invalid username or password.');
        } else if (!err.response) {
            toast.error('Network error. Please check your internet connection.');
        } else {
            toast.error('An unexpected error occurred. Please try again later.');
        }
    } finally {
        setIsLoading(false);
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