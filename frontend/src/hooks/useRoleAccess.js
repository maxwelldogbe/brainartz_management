import { useAuth } from '../context/AuthContext';

// Hook for role-based logic
export function useRoleAccess() {
  const auth = useAuth();
  
  return {
    ...auth,
    canAccessAdminFeatures: auth.hasAdminAccess(),
    canAccessWorkerFeatures: auth.hasWorkerAccess(),
    canManageEmployees: auth.canManageEmployees(),
    canViewAdminDashboard: auth.canViewAdminDashboard(),
    getUserRoleString: () => {
      if (auth.hasAdminAccess()) return 'Administrator';
      if (auth.hasWorkerAccess()) return 'Employee';
      return 'User';
    }
  };
}