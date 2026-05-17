import axios from 'axios';
import { useStore } from '../store/useStore';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // IMPORTANT for sending httpOnly cookies (like cartSessionId and refreshToken)
});

const PUBLIC_ROUTE_PREFIXES = [
  '/products',
  '/categories',
  '/auth/login',
  '/auth/register',
  '/auth/admin-login',
  '/auth/forgot-password',
  '/auth/refresh',
  '/chatbot',
  '/cart',
];

// Interceptor to attach access token if it exists in store
api.interceptors.request.use(
  (config) => {
    const token = useStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle 401 Unauthorized (optional: trigger refresh token flow)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If 401 and we haven't already retried this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to hit refresh endpoint. The backend uses the httpOnly refreshToken cookie.
        const res = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
        
        if (res.data?.data?.accessToken) {
          const newAccessToken = res.data.data.accessToken;
          useStore.getState().setAuth(newAccessToken, res.data.data.user || null);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, user needs to login again
        useStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);
