import { useEffect, useState, useCallback } from 'react';
import { fetchWorkers, deleteUser, toggleUserActive, resendCredentials } from '../utils/services';
import { useNavigate } from 'react-router-dom';
import CredentialsModal from '../components/CredentialsModal';
import Alert from '../components/Alert';

export default function Workers() {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [credentialsModal, setCredentialsModal] = useState({
    isOpen: false,
    credentials: null
  });
  const [actionLoading, setActionLoading] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchWorkers();
      setWorkers(data);
    } catch (err) {
      console.error('Failed to load workers', err);
      setWorkers([]);
      showNotification('Failed to load employees', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // No need to check admin status here since RoleGuard already handles it
    load();
  }, [load]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const setWorkerActionLoading = (workerId, loading) => {
    setActionLoading(prev => ({
      ...prev,
      [workerId]: loading
    }));
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    
    setWorkerActionLoading(id, true);
    try {
      await deleteUser(id);
      setWorkers(workers.filter(w => w.id !== id));
      showNotification(`${name} has been deleted`, 'success');
    } catch (err) {
      console.error('Failed to delete user', err);
      showNotification('Failed to delete user', 'error');
    } finally {
      setWorkerActionLoading(id, false);
    }
  };

  const handleToggle = async (id, active, name) => {
    setWorkerActionLoading(id, true);
    try {
      await toggleUserActive(id, !active);
      setWorkers(workers.map(w => w.id === id ? { ...w, is_active: !active } : w));
      showNotification(`${name} has been ${!active ? 'enabled' : 'disabled'}`, 'success');
    } catch (err) {
      console.error('Failed to update user active state', err);
      showNotification('Failed to update user state', 'error');
    } finally {
      setWorkerActionLoading(id, false);
    }
  };

  const handleResendCredentials = async (userId, name, resetPassword = false) => {
    setWorkerActionLoading(userId, true);
    try {
      const result = await resendCredentials(userId, resetPassword);
      
      if (result.sms_sent) {
        showNotification(`Credentials sent to ${name} via SMS`, 'success');
        
        // If password was reset and SMS succeeded, still show modal with new password for admin records
        if (resetPassword && result.login_credentials) {
          setCredentialsModal({
            isOpen: true,
            credentials: {
              ...result.login_credentials,
              smsStatus: true
            }
          });
        }
      } else {
        // Show credentials modal for manual sharing
        if (result.login_credentials) {
          setCredentialsModal({
            isOpen: true,
            credentials: {
              ...result.login_credentials,
              smsStatus: false
            }
          });
          showNotification(
            resetPassword 
              ? `Password reset for ${name}. Share new credentials manually.` 
              : `Credentials ready for manual sharing to ${name}`, 
            'warning'
          );
        } else {
          showNotification(`Could not retrieve credentials for ${name}`, 'error');
        }
      }
    } catch (err) {
      console.error('Failed to resend credentials', err);
      const errorMsg = err.response?.data?.error || 'Failed to process request';
      showNotification(errorMsg, 'error');
    } finally {
      setWorkerActionLoading(userId, false);
    }
  };

  const handleResetPassword = (userId, name) => {
    if (!confirm(`Reset password for ${name}? They will need new login credentials.`)) return;
    handleResendCredentials(userId, name, true);
  };

  const handleCloseCredentials = () => {
    setCredentialsModal({
      isOpen: false,
      credentials: null
    });
  };

  if (loading) return (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-2 text-gray-600">Loading employees...</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-600 mt-1">Manage employee accounts and credentials</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/portal/invite')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <Alert 
          type={notification.type}
          onClose={() => setNotification(null)}
        >
          {notification.message}
        </Alert>
      )}

      {/* Employees Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {workers && workers.length === 0 ? (
            <div className="p-8 text-center">
            
            <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
            <p className="text-gray-600 mb-4">Get started by inviting your first employee.</p>
            <button
              onClick={() => navigate('/portal/invite')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Invite Employee
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username / Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {workers && workers.map(w => (
                  <tr key={w.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {w.first_name} {w.last_name}
                        </div>
                        <div className="text-sm text-gray-500">@{w.username}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">@{w.username}</div>
                      <div className="text-sm text-gray-500">
                        {w.profile?.phone || 'No phone'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        w.is_admin 
                          ? 'bg-purple-100 text-purple-800' 
                          : w.is_worker 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {w.is_admin ? 'Admin' : w.is_worker ? 'Employee' : 'User'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        w.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {w.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Resend Credentials */}
                        <button
                          onClick={() => handleResendCredentials(w.id, `${w.first_name} ${w.last_name}`)}
                          disabled={actionLoading[w.id]}
                          className="px-2 py-1 text-xs text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Resend current login credentials"
                        >
                          {actionLoading[w.id] ? 'Loading...' : 'Resend'}
                        </button>

                        {/* Reset Password */}
                        <button
                          onClick={() => handleResetPassword(w.id, `${w.first_name} ${w.last_name}`)}
                          disabled={actionLoading[w.id]}
                          className="px-2 py-1 text-xs text-amber-600 hover:text-amber-900 hover:bg-amber-50 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Generate new password and send credentials"
                        >
                          {actionLoading[w.id] ? 'Loading...' : 'Reset'}
                        </button>

                        {/* Toggle Active Status */}
                        <button
                          onClick={() => handleToggle(w.id, w.is_active, `${w.first_name} ${w.last_name}`)}
                          disabled={actionLoading[w.id]}
                          className={`px-2 py-1 text-xs rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                            w.is_active 
                              ? 'text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50' 
                              : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                          }`}
                          title={w.is_active ? 'Disable this account' : 'Enable this account'}
                        >
                          {actionLoading[w.id] ? 'Loading...' : (w.is_active ? 'Disable' : 'Enable')}
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(w.id, `${w.first_name} ${w.last_name}`)}
                          disabled={actionLoading[w.id]}
                          className="px-2 py-1 text-xs text-red-600 hover:text-red-900 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Permanently delete this account"
                        >
                          {actionLoading[w.id] ? 'Loading...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Credentials Modal */}
      <CredentialsModal
        isOpen={credentialsModal.isOpen}
        credentials={credentialsModal.credentials}
        onClose={handleCloseCredentials}
      />
    </div>
  );
}
