// src/utils/axios.js
import axios from 'axios';

// Use relative paths for same-origin requests (production)
// Use empty baseURL in dev to leverage Vite proxy
const isDev = import.meta.env.DEV;
const baseURL = isDev ? '' : '';

console.log('Axios config:', {
  isDev,
  hostname: window.location.hostname,
  baseURL: baseURL || 'Using relative paths (same origin)',
  mode: import.meta.env.MODE
});

const instance = axios.create({
  baseURL,
  timeout: 10000, // 10 second timeout
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
  }
});

instance.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('Axios request:', {
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
    console.log('Axios response:', {
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
    console.error('Axios error:', {
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      message: error.message,
      data: error.response?.data,
      isNetworkError: error.code === 'ERR_NETWORK'
    });
    
    // Handle 401 errors by clearing auth state
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
    
    return Promise.reject(error);
  }
);

export default instance;
