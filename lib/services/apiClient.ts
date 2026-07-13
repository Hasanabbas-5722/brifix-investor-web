import axios from 'axios';
import { API_BASE_URL } from './apiConfig';
import { isTokenExpired } from '@/lib/utils/auth';

/** Axios instance for `/api/v1/*` routes (parity with React Native `AuthService.js`). */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      // Lazy load store and actions to prevent circular dependencies
      const { store } = require('@/lib/store/store');
      const { clearCredentials } = require('@/lib/store/slices/authSlice');

      const token = store.getState().auth?.token || localStorage.getItem('accessToken');

      if (token) {
        if (isTokenExpired(token)) {
          // Token is expired! Clean auth data
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          store.dispatch(clearCredentials());

          // Redirect to sign-in page if not already there
          if (window.location.pathname !== '/signin' && window.location.pathname !== '/login') {
            window.location.href = '/signin';
          }
          return Promise.reject(new Error('Token expired'));
        }
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);
