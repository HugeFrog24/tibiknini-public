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

api.interceptors.request.use(request => {
    request.headers['X-CSRFToken'] = getCookie('csrftoken');
    return request;
});

api.interceptors.response.use(
    response => {
        // Check if this is the setup status endpoint and status is complete
        if (response.config.url.endsWith('/setup/status/') && response.data.status === 'complete') {
            showToast(TOAST_MESSAGES.SETUP_ALREADY, 'info'); // This will be the only place to show this toast
            navigate('/');
            throw new axios.Cancel('Setup is already complete');
        }
        return response;
    },
    error => {
        if (error.response && error.response.status === 503) {
            navigate('/setup');
        } else if (error.response && error.response.status === 401) {
            navigate('/login');
        }
        return Promise.reject(error);
    }
);

function getCookie(name) {
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

export default api;
