import axios from 'axios';
import { createBrowserHistory } from 'history';

const history = createBrowserHistory();
let apiUrl = '';  // This will be set later using setApiUrl

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

api.interceptors.request.use(request => {
    request.headers['X-CSRFToken'] = getCookie('csrftoken');
    return request;
});

api.interceptors.response.use(
    response => response,
    error => {
        if (error.response.status === 401) {
            history.push('/login');
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
