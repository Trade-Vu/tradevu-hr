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
    const serverMessage = error.response?.data?.message;

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
