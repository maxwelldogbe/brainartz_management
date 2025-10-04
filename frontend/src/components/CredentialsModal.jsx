import React, { useState } from 'react';
import Modal from './Modal';

export default function CredentialsModal({ isOpen, credentials, onClose }) {
  const [copied, setCopied] = useState({});

  const copyToClipboard = async (field, value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied({ ...copied, [field]: true });
      setTimeout(() => setCopied({ ...copied, [field]: false }), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = value;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      setCopied({ ...copied, [field]: true });
      setTimeout(() => setCopied({ ...copied, [field]: false }), 2000);
    }
  };

  const handleClose = () => {
    setCopied({});
    onClose();
  };

  if (!credentials) return null;

  return (
    <Modal open={isOpen} onClose={handleClose} title="🔑 Employee Login Credentials">
      <div className="space-y-6">
        {/* Security Warning */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🔒</span>
            <div>
              <h4 className="font-semibold text-amber-800">Security Notice</h4>
              <p className="text-sm text-amber-700">
                Share these credentials securely with the employee via a trusted communication method.
              </p>
            </div>
          </div>
        </div>

        {/* SMS Status */}
        {credentials.smsStatus && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">✅</span>
              <div>
                <h4 className="font-semibold text-green-800">SMS Sent Successfully</h4>
                <p className="text-sm text-green-700">
                  Credentials have also been sent to the employee's phone via SMS.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Credentials */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Login Details</h3>
          
          {/* Username */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Username:</label>
            <div className="flex items-center space-x-2 bg-gray-50 border rounded-lg p-3">
              <code className="flex-1 text-sm font-mono bg-transparent">
                {credentials.username}
              </code>
              <button
                onClick={() => copyToClipboard('username', credentials.username)}
                className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <span>{copied.username ? '✓' : '📋'}</span>
                <span>{copied.username ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Password:</label>
            <div className="flex items-center space-x-2 bg-gray-50 border rounded-lg p-3">
              <code className="flex-1 text-sm font-mono bg-transparent">
                {credentials.password}
              </code>
              <button
                onClick={() => copyToClipboard('password', credentials.password)}
                className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <span>{copied.password ? '✓' : '📋'}</span>
                <span>{copied.password ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Email */}
          {credentials.email && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Email:</label>
              <div className="flex items-center space-x-2 bg-gray-50 border rounded-lg p-3">
                <code className="flex-1 text-sm font-mono bg-transparent">
                  {credentials.email}
                </code>
                <button
                  onClick={() => copyToClipboard('email', credentials.email)}
                  className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  <span>{copied.email ? '✓' : '📋'}</span>
                  <span>{copied.email ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">Instructions for Employee</h4>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Use the provided username and password to log in to the system</li>
            <li>Change the password immediately after the first successful login</li>
            <li>Keep login credentials secure and don't share them with others</li>
            <li>Contact the administrator if you experience any login issues</li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              const allCredentials = `Username: ${credentials.username}\nPassword: ${credentials.password}${credentials.email ? `\nEmail: ${credentials.email}` : ''}`;
              copyToClipboard('all', allCredentials);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            {copied.all ? '✓ Copied All' : '📋 Copy All'}
          </button>
        </div>
      </div>
    </Modal>
  );
}