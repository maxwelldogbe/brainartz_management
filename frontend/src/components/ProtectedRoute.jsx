import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

export default function PrivateRoute({ children }) {
    const { isAuthenticated, loading, user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && isAuthenticated && user) {
            // If user is admin and they landed on root, send to admin dashboard
            if (user.is_admin && (location.pathname === '/' || location.pathname === '')) {
                navigate('/admin-dashboard', { replace: true });
            }
        }
    }, [loading, isAuthenticated, user, location.pathname, navigate]);

    if (loading) return null; // You can return a loader here

    return isAuthenticated ? children : <Navigate to="/login" replace />;
}
