import axios from 'axios';
import { showToast } from './toastUtils';
import { TOAST_MESSAGES } from '../components/constants/Strings';

let apiUrl = ''; // This will be set later using setApiUrl
let navigate;

const api = axios.create({
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    }
});

// Function to set the API URL
export const setApiUrl = (url) => {
    apiUrl = url;
    api.defaults.baseURL = url;  // Set the baseURL on the Axios instance
};

export const setNavigate = (navigateFunction) => {
    navigate = navigateFunction;
};

// List of endpoints that don't require authentication
const PUBLIC_ENDPOINTS = [
    '/auth/login/',
    '/auth/register/',
    '/setup/status/',
    '/blog/posts/',  // Assuming this is your public blog posts endpoint
    '/users/me/',    // We'll allow this to fail silently
    '/privacy_policy/',
    '/terms_of_service/',
];

const isPublicEndpoint = (url) => {
    return PUBLIC_ENDPOINTS.some(endpoint => url?.includes(endpoint));
};

const isClient = typeof window !== 'undefined';

function getCookie(name) {
    if (!isClient) return null;
    
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

api.interceptors.request.use(request => {
    // Add /api prefix to URLs if not already present
    if (request.url && !request.url.startsWith('/api')) {
        request.url = `/api${request.url}`;
    }
    
    if (isClient) {
        request.headers['X-CSRFToken'] = getCookie('csrftoken');
    }
    return request;
});

api.interceptors.response.use(
    response => {
        // Check if this is the setup status endpoint and status is complete
        if (isClient && response.config.url?.endsWith('/setup/status/') && response.data.status === 'complete') {
            showToast(TOAST_MESSAGES.SETUP_ALREADY, 'info');
            navigate('/');
        }
        return response;
    },
    error => {
        if (axios.isCancel(error)) {
            return new Promise(() => {});
        }

        const isPublic = isPublicEndpoint(error.config?.url);

        if (error.response && isClient) {
            if (error.response.status === 503) {
                navigate('/setup');
            } else if ((error.response.status === 401 || error.response.status === 403) && !isPublic) {
                // Only redirect to login for protected routes
                const currentPath = window.location.pathname;
                navigate('/login', { 
                    state: { 
                        reason: 'AUTH_REQUIRED',
                        from: currentPath // Store the path user was trying to access
                    } 
                });
            }
        }
        return Promise.reject(error);
    }
);

export default api;
