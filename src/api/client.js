import axios from 'axios';
import { appParams } from '@/lib/app-params';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request Interceptor: inject Bearer token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || appParams?.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: unwrap ApiResponse<T> payload
apiClient.interceptors.response.use(
  (response) => {
    // If backend returns { success: true, data: ..., pagination?: ... }
    if (response.data && response.data.success !== undefined) {
      if (response.data.pagination) {
        return {
          data: response.data.data,
          pagination: response.data.pagination,
        };
      }
      return response.data.data;
    }
    return response.data;
  },
  (error) => {
    const status = error.response?.status;
    let serverMessage = error.response?.data?.message;

    // A 404 whose message is literally "Cannot GET /some/path" is Nest's own
    // built-in "no route matched" message (from an unmatched route, not a
    // NotFoundException a controller intentionally threw) — it leaks the raw
    // request path and internal HTTP method to the UI. Never show that
    // verbatim; a route rarely being missing is a deploy/wiring issue, not
    // something the user did wrong.
    if (status === 404 && /^Cannot (GET|POST|PUT|PATCH|DELETE) /.test(serverMessage || '')) {
      serverMessage = 'The requested resource could not be found. Please try again in a moment.';
    }

    // Handle token expiration or unauthorized
    if (status === 401) {
      const currentPath = window.location.pathname.toLowerCase();
      const isAuthPage =
        currentPath.includes('/login') ||
        currentPath.includes('/register') ||
        currentPath.includes('/forgot-password') ||
        currentPath.includes('/resetpassword');

      if (!isAuthPage) {
        localStorage.removeItem('token');
        localStorage.removeItem('tradevu_view_mode');
      }
    }

    const message = Array.isArray(serverMessage)
      ? serverMessage.join(', ')
      : serverMessage || error.message || 'An unexpected error occurred';

    const enhancedError = new Error(message);
    enhancedError.status = status;
    enhancedError.raw = error;
    return Promise.reject(enhancedError);
  }
);

export default apiClient;
