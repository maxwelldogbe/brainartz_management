import React, { useState } from 'react';
import axios from '../utils/axios';

/**
 * NetworkDiagnostic Component
 * Helper component to test API connectivity
 */
const NetworkDiagnostic = () => {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setStatus('Testing connection...');

    try {
      // Test basic connectivity
      const response = await axios.post('/auth/jwt/create/', {
        email: 'test@test.com',
        password: 'wrongpassword'
      });
      setStatus('✅ Connection successful (got response)');
    } catch (error) {
      if (error.response) {
        // Got a response from server (good!)
        setStatus(`✅ Connection working! Server responded with: ${error.response.status} - ${error.response.data?.detail || 'Server reachable'}`);
      } else if (error.request) {
        // Network error (bad)
        setStatus(`❌ Network Error: Cannot reach backend server. Check if backend is running on port 8000.`);
      } else {
        setStatus(`❌ Request Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed top-4 right-4 bg-white p-4 rounded-lg shadow-lg border z-50 max-w-md">
      <h3 className="font-semibold text-gray-900 mb-2">Network Diagnostic</h3>
      
      <button
        onClick={testConnection}
        disabled={loading}
        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50 mb-2"
      >
        {loading ? 'Testing...' : 'Test API Connection'}
      </button>
      
      {status && (
        <div className={`text-sm p-2 rounded ${
          status.includes('✅') 
            ? 'bg-green-50 text-green-800' 
            : 'bg-red-50 text-red-800'
        }`}>
          {status}
        </div>
      )}
      
      <div className="text-xs text-gray-500 mt-2">
        Frontend: {window.location.origin}<br/>
        Backend: {import.meta.env.VITE_API_URL || 'http://localhost:8000 (via proxy)'}
      </div>
    </div>
  );
};

export default NetworkDiagnostic;