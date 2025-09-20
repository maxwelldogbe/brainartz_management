/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import axios from '../utils/axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsAuthenticated(true);
            // fetch current user details
            axios.get('/auth/users/me/')
                .then(res => setUser(res.data))
                .catch(() => setUser(null))
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = (token, refreshToken) => {
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        setIsAuthenticated(true);
    // fetch user after login and return promise so callers can await it
    return axios.get('/auth/users/me/').then(res => { setUser(res.data); return res.data }).catch(() => { setUser(null); return null });
    };

    const refreshUser = () => {
        const token = localStorage.getItem('token');
        if (!token) return Promise.resolve(null);
        return axios.get('/auth/users/me/').then(res => { setUser(res.data); return res.data }).catch(() => { setUser(null); return null });
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout, loading, user, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
