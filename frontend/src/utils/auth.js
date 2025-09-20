// src/api/auth.js
import axios from '../utils/axios';

export const loginUser = async (email, password) => {
  const res = await axios.post('/auth/jwt/create/', { email, password });
  return res.data;
};

export const refreshToken = async refresh => {
  const res = await axios.post('/auth/jwt/refresh/', { refresh });
  return res.data;
};


export const registerUserFromToken = async (token, username, password, re_password) => {
  console.log("Making request with token:", token); // Debug token value
  try {
    const res = await axios.post(`/api/auth/register/${token}/`, { 
      username,
      password,
      re_password,
    });
    return res.data;
  } catch (error) {
    console.error("Registration error:", error.response);
    throw error.response.data;
  }
};

// // Optional - activation
// export const activateUser = async (uid, token) => {
//   const res = await axios.post('/auth/users/activation/', { uid, token });
//   return res.data;
// };

// export function logout() {
//   localStorage.removeItem("access_token");
//   localStorage.removeItem("refresh_token");
//   window.location.href = "/login"; // or use navigate() if inside a component
// }
