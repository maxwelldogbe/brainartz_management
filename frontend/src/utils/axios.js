// src/utils/axios.js
import axios from 'axios';

// Force proxy usage in development by checking if we're on localhost
const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const baseURL = isDev ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:8000');

console.log('Environment check:', {
  isDev,
  hostname: window.location.hostname,
  baseURL: baseURL || 'Using Vite proxy',
  mode: import.meta.env.MODE
});

const instance = axios.create({
  baseURL,
  timeout: 10000, // 10 second timeout
  withCredentials: false, // Don't send cookies cross-origin
  headers: {
    'Content-Type': 'application/json',
  }
});

instance.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('API Request:', {
    method: config.method?.toUpperCase(),
    url: config.url,
    fullURL: baseURL ? `${baseURL}${config.url}` : `Proxy: ${window.location.origin}${config.url}`,
    hasAuth: !!token,
    usingProxy: !baseURL
  });
  return config;
});

instance.interceptors.response.use(
  (response) => {
    console.log('API Response Success:', {
      status: response.status,
      url: response.config.url,
      method: response.config.method?.toUpperCase(),
      dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
      dataLength: Array.isArray(response.data) ? response.data.length : 'N/A',
      dataKeys: typeof response.data === 'object' ? Object.keys(response.data) : 'N/A'
    });
    return response;
  },
  (error) => {
    console.error('API Response Error:', {
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      message: error.message,
      data: error.response?.data,
      isNetworkError: error.code === 'ERR_NETWORK'
    });
    
    // Handle 401 errors by clearing auth state
    if (error.response?.status === 401) {
      console.log('Unauthorized request, clearing tokens');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
    
    return Promise.reject(error);
  }
);

export default instance;
