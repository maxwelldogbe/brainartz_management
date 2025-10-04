import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

export default function ProtectedRoute({ children }) {
    const { isAuthenticated, loading, user, hasAdminAccess } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && isAuthenticated && user) {
            console.log('User role check:', {
                is_admin: user.is_admin,
                is_worker: user.is_worker,
                is_superuser: user.is_superuser,
                hasAdminAccess: hasAdminAccess()
            });

            // Role-based redirection logic
            if (location.pathname === '/' || location.pathname === '') {
                if (hasAdminAccess()) {
                    navigate('/admin-dashboard', { replace: true });
                } else {
                    // Regular users/workers stay on main dashboard
                    navigate('/dashboard', { replace: true });
                }
            }
        }
    }, [loading, isAuthenticated, user, location.pathname, navigate, hasAdminAccess]);

    // Show loading spinner while authentication is being checked
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Show loading while user data is being fetched
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading user data...</p>
                </div>
            </div>
        );
    }

    return children;
}
