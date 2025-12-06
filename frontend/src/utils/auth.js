// src/utils/auth.js - Enhanced for Djoser integration
import axios from '../utils/axios';

// =============== DJOSER AUTHENTICATION ENDPOINTS ===============

export const loginUser = async (email, password) => {
  try {
    const res = await axios.post('/auth/jwt/create/', { email, password });
      status: res.status, 
      hasAccess: !!res.data.access, 
      hasRefresh: !!res.data.refresh 
    });
    return res.data;
  } catch (error) {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    throw error;
  }
};

export const refreshToken = async refresh => {
  try {
    const res = await axios.post('/auth/jwt/refresh/', { refresh });
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const verifyToken = async (token) => {
  try {
    const res = await axios.post('/auth/jwt/verify/', { token });
    return res.data;
  } catch (error) {
    throw error;
  }
};

// =============== DJOSER USER MANAGEMENT ===============

export const getCurrentUser = async () => {
  try {
    const res = await axios.get('/auth/users/me/');
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const updateCurrentUser = async (userData) => {
  try {
    const res = await axios.patch('/auth/users/me/', userData);
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const changePassword = async (current_password, new_password, re_new_password) => {
  try {
    const res = await axios.post('/auth/users/set_password/', {
      current_password,
      new_password,
      re_new_password
    });
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const resetPassword = async (email) => {
  try {
    const res = await axios.post('/auth/users/reset_password/', { email });
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const confirmPasswordReset = async (uid, token, new_password, re_new_password) => {
  try {
    const res = await axios.post('/auth/users/reset_password_confirm/', {
      uid,
      token, 
      new_password,
      re_new_password
    });
    return res.data;
  } catch (error) {
    throw error;
  }
};

// =============== CUSTOM REGISTRATION (Via your authentication app) ===============

export const registerUserFromToken = async (token, username, password, re_password) => {
  try {
    const res = await axios.post(`/api/authentication/register/${token}/`, { 
      username,
      password,
      re_password,
    });
    return res.data;
  } catch (error) {
    throw error;
  }
};

// =============== DJOSER USER ACTIVATION (if needed) ===============

export const activateUser = async (uid, token) => {
  try {
    const res = await axios.post('/auth/users/activation/', { uid, token });
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const resendActivation = async (email) => {
  try {
    const res = await axios.post('/auth/users/resend_activation/', { email });
    return res.data;
  } catch (error) {
    throw error;
  }
};

// =============== UTILITY FUNCTIONS ===============

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  // Could also call a logout endpoint if needed
  // axios.post('/auth/token/logout/'); // If using token auth instead of JWT
};

export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    return true;
  }
};

// =============== DJOSER ADMIN USER MANAGEMENT ===============
// These functions use Djoser's user endpoints for admin operations

export const listAllUsers = async () => {
  try {
    const res = await axios.get('/auth/users/');
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const getUserById = async (id) => {
  try {
    const res = await axios.get(`/auth/users/${id}/`);
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const updateUser = async (id, userData) => {
  try {
    const res = await axios.patch(`/auth/users/${id}/`, userData);
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const deleteUser = async (id) => {
  try {
    const res = await axios.delete(`/auth/users/${id}/`);
    return res.data;
  } catch (error) {
    throw error;
  }
};
