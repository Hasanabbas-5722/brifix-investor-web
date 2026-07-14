import axios from 'axios';
import { API_BASE_URL } from './apiConfig';


/** Axios instance for `/api/v1/*` routes (parity with React Native `AuthService.js`). */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      // Lazy load store and actions to prevent circular dependencies
      const { store } = require('@/lib/store/store');

      const token = store.getState().auth?.token || localStorage.getItem('accessToken');

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined' && error.response && error.response.status === 401) {
      const { store } = require('@/lib/store/store');
      const { clearCredentials } = require('@/lib/store/slices/authSlice');

      // Token is expired! Clean auth data
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      store.dispatch(clearCredentials());

      // Redirect to sign-in page if not already there
      if (window.location.pathname !== '/signin' && window.location.pathname !== '/login') {
        window.location.href = '/signin';
      }
    }
    return Promise.reject(error);
  }
);
