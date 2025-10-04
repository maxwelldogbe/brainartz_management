import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

// Component to protect routes based on user roles
export function RoleGuard({ 
  children, 
  requireAdmin = false, 
  requireWorker = false,
  fallbackPath = '/',
  showMessage = true 
}) {
  const { user, loading, hasAdminAccess, hasWorkerAccess } = useAuth();

  // Show loading while user data is being fetched
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Checking permissions...</span>
      </div>
    );
  }

  // If no user is loaded, redirect to fallback
  if (!user) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Check admin access requirement
  if (requireAdmin && !hasAdminAccess()) {
    if (showMessage) {
      return (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You need administrator privileges to access this page.
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      );
    }
    return <Navigate to={fallbackPath} replace />;
  }

  // Check worker access requirement
  if (requireWorker && !hasWorkerAccess()) {
    if (showMessage) {
      return (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You need worker privileges to access this page.
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      );
    }
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
}

// Component to conditionally render content based on roles
export function RoleBasedContent({ 
  children, 
  requireAdmin = false, 
  requireWorker = false,
  fallback = null 
}) {
  const { hasAdminAccess, hasWorkerAccess } = useAuth();

  // Check admin access requirement
  if (requireAdmin && !hasAdminAccess()) {
    return fallback;
  }

  // Check worker access requirement
  if (requireWorker && !hasWorkerAccess()) {
    return fallback;
  }

  return children;
}