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
                .then(res => {
                    setUser(res.data);
                    console.log('User loaded:', res.data); // Debug user roles
                })
                .catch(() => {
                    setUser(null);
                    setIsAuthenticated(false);
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = (token, refreshToken) => {
        console.log('Starting login process with tokens');
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        
        // fetch user after login and return promise so callers can await it
        return axios.get('/auth/users/me/')
            .then(res => { 
                console.log('User data fetched successfully:', res.data);
                setUser(res.data);
                setIsAuthenticated(true); // Set authentication AFTER user is loaded
                return res.data; 
            })
            .catch(error => { 
                console.error('Failed to fetch user after login:', error);
                setUser(null); 
                setIsAuthenticated(false);
                // Clean up tokens on user fetch failure
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                throw error; // Re-throw so Login component knows it failed
            });
    };

    const refreshUser = () => {
        const token = localStorage.getItem('token');
        if (!token) return Promise.resolve(null);
        return axios.get('/auth/users/me/')
            .then(res => { 
                setUser(res.data); 
                return res.data; 
            })
            .catch(() => { 
                setUser(null); 
                setIsAuthenticated(false);
                return null; 
            });
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setIsAuthenticated(false);
        setUser(null);
    };

    // Role checking utilities
    const isAdmin = () => Boolean(user?.is_admin);
    const isWorker = () => Boolean(user?.is_worker);
    const isSuperuser = () => Boolean(user?.is_superuser);
    
    // Check if user has any admin privileges
    const hasAdminAccess = () => isAdmin() || isSuperuser();
    
    // Check if user can access worker features
    const hasWorkerAccess = () => isWorker() || hasAdminAccess();
    
    // Check if user can manage employees
    const canManageEmployees = () => hasAdminAccess();
    
    // Check if user can view admin dashboard
    const canViewAdminDashboard = () => hasAdminAccess();

    const contextValue = {
        isAuthenticated,
        login,
        logout,
        loading,
        user,
        refreshUser,
        // Role checking methods
        isAdmin,
        isWorker,
        isSuperuser,
        hasAdminAccess,
        hasWorkerAccess,
        canManageEmployees,
        canViewAdminDashboard
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
