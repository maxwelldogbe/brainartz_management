import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployeeInviteForm from '../components/EmployeeInviteForm';
import ManualEmployeeForm from '../components/ManualEmployeeForm';
import CredentialsModal from '../components/CredentialsModal';
import Alert from '../components/Alert';

export default function Invite() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('invite');
  const [notification, setNotification] = useState(null);
  const [credentialsModal, setCredentialsModal] = useState({
    isOpen: false,
    credentials: null
  });

  // No need for admin check here since RoleGuard handles it

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleInviteSuccess = (message) => {
    showNotification(message, 'success');
  };

  const handleInviteError = (message, type = 'error') => {
    showNotification(message, type);
  };

  const handleFallbackSuggested = () => {
    showNotification('SMS failed. You can create the account manually below.', 'warning');
    setActiveTab('manual');
  };

  const handleCredentialsGenerated = (credentials) => {
    setCredentialsModal({
      isOpen: true,
      credentials
    });
  };

  const handleCloseCredentials = () => {
    setCredentialsModal({
      isOpen: false,
      credentials: null
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Employee Management</h1>
        <p className="text-gray-600">
          Invite new employees via SMS or create accounts manually as a fallback option.
        </p>
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

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('invite')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'invite'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📱 SMS Invitation
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'manual'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            👤 Manual Creation
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'invite' && (
          <EmployeeInviteForm
            onSuccess={handleInviteSuccess}
            onError={handleInviteError}
            onFallbackSuggested={handleFallbackSuggested}
          />
        )}

        {activeTab === 'manual' && (
          <ManualEmployeeForm
            onSuccess={handleInviteSuccess}
            onError={handleInviteError}
            onCredentialsGenerated={handleCredentialsGenerated}
          />
        )}
      </div>

      {/* Quick Action Buttons */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-200">
        <div>
          <button
            onClick={() => navigate('/portal/workers')}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            👥 View All Employees →
          </button>
        </div>
        <div className="text-sm text-gray-500">
          Need help? Check the instructions in each form section.
        </div>
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
