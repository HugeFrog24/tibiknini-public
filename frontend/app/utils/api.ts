import axios, { 
    AxiosInstance, 
    AxiosRequestConfig, 
    AxiosResponse, 
    AxiosError,
    InternalAxiosRequestConfig
} from 'axios';
import { showToast } from './toastUtils';

// Types
type NavigateFunction = (
    to: string,
    options?: { 
        state?: { 
            reason?: string;
            from?: string;
            [key: string]: any;
        };
        [key: string]: any;
    }
) => void;

interface SetupStatusResponse {
    status: 'complete' | 'pending' | 'not_started';
}

// Constants
const PUBLIC_ENDPOINTS = [
    '/auth/login/',
    '/auth/register/',
    '/setup/status/',
    '/blog/posts/',
    '/users/me/',
    '/privacy_policy/',
    '/terms_of_service/',
] as const;

const TOAST_MESSAGES = {
    SETUP_ALREADY: 'Setup is already complete',
} as const;

// Utility functions
const isClient = typeof window !== 'undefined';

const isPublicEndpoint = (url: string | undefined): boolean => {
    return PUBLIC_ENDPOINTS.some(endpoint => url?.includes(endpoint));
};

const getCookie = (name: string): string | null => {
    if (!isClient) return null;
    
    let cookieValue: string | null = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
};

const getDefaultBaseUrl = (): string => {
    if (!isClient) return '';
    
    const protocol = window.location.protocol;
    const host = window.location.host;
    // If we're running on dev server port (3000), use port 80 for API calls
    const apiHost = host.includes(':3000') ? host.replace(':3000', '') : host;
    return `${protocol}//${apiHost}`;
};

// API class
class Api {
    private instance: AxiosInstance;
    private navigate: NavigateFunction | null = null;

    constructor() {
        this.instance = axios.create({
            baseURL: getDefaultBaseUrl(),
            withCredentials: true,
            headers: {
                "Content-Type": "application/json",
            }
        });

        this.setupInterceptors();
    }

    private setupInterceptors(): void {
        // Request interceptor
        this.instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
            // Add /api prefix to URLs if not already present
            if (config.url && !config.url.startsWith('/api')) {
                config.url = `/api${config.url}`;
            }
            
            // Add CSRF token
            if (isClient) {
                config.headers.set('X-CSRFToken', getCookie('csrftoken') || '');
            }

            return config;
        });

        // Response interceptor
        this.instance.interceptors.response.use(
            (response: AxiosResponse) => {
                // Check if this is the setup status endpoint and status is complete
                if (
                    isClient && 
                    response.config.url?.endsWith('/setup/status/') && 
                    (response.data as SetupStatusResponse).status === 'complete'
                ) {
                    showToast(TOAST_MESSAGES.SETUP_ALREADY, 'info');
                    this.navigate?.('/');
                }
                return response;
            },
            (error: unknown) => {
                // Handle cancellation first
                if (axios.isCancel(error)) {
                    return new Promise(() => {});
                }

                // Type guard for AxiosError
                if (!axios.isAxiosError(error)) {
                    return Promise.reject(error);
                }

                // Now TypeScript knows error is AxiosError
                const axiosError = error as AxiosError;
                const isPublic = isPublicEndpoint(axiosError.config?.url);

                if (axiosError.response && isClient && this.navigate) {
                    const status = axiosError.response.status;
                    if (status === 503) {
                        this.navigate('/setup');
                    } else if ((status === 401 || status === 403) && !isPublic) {
                        // Only redirect to login for protected routes
                        const currentPath = window.location.pathname;
                        this.navigate('/login', { 
                            state: { 
                                reason: 'AUTH_REQUIRED',
                                from: currentPath
                            } 
                        });
                    }
                }
                return Promise.reject(axiosError);
            }
        );
    }

    setBaseUrl(url: string): void {
        this.instance.defaults.baseURL = url;
    }

    setNavigate(navigateFunction: NavigateFunction): void {
        this.navigate = navigateFunction;
    }

    // Expose the axios instance methods with proper typing
    get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return this.instance.get(url, config);
    }

    post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return this.instance.post(url, data, config);
    }

    put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return this.instance.put(url, data, config);
    }

    delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return this.instance.delete(url, config);
    }

    patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return this.instance.patch(url, data, config);
    }
}

// Create and export a singleton instance
const api = new Api();
export default api;

// Export utility functions
export const setApiUrl = (url: string): void => api.setBaseUrl(url);
export const setNavigate = (navigateFunction: NavigateFunction): void => api.setNavigate(navigateFunction);
