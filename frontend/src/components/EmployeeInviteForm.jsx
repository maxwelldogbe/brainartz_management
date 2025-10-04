import React, { useState } from 'react';
import { sendInvite } from '../utils/services';
import { validateEmployeeForm, formatPhoneNumber } from '../utils/validation';
import { BackendNotImplemented } from './TemporaryFallback';

export default function EmployeeInviteForm({ onSuccess, onError, onFallbackSuggested }) {
  const [form, setForm] = useState({
    phone: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showBackendError, setShowBackendError] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Format phone number as user types
    if (name === 'phone') {
      processedValue = formatPhoneNumber(value);
    }

    setForm(prev => ({
      ...prev,
      [name]: processedValue
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validation = validateEmployeeForm(form, 'invite');
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const result = await sendInvite(form);
      
      if (result.sms_sent) {
        onSuccess?.('SMS invitation sent successfully! 🎉');
      } else {
        onError?.('SMS delivery failed. Consider manual account creation.', 'warning');
        // Show fallback options
        if (result.fallback_suggestion) {
          onFallbackSuggested?.(result.fallback_suggestion, form);
        }
      }
      
      // Reset form on success
      setForm({ phone: '', email: '' });
    } catch (error) {
      console.error('Invite error:', error);
      
      // Check if it's a 404 (backend not implemented)
      if (error.response?.status === 404) {
        setShowBackendError(true);
        return;
      }
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail || 
                          'Failed to send invitation';
      onError?.(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Show backend not implemented message
  if (showBackendError) {
    return (
      <BackendNotImplemented 
        feature="SMS Employee Invitation"
        endpoint="POST /api/authentication/invite/"
        onClose={() => setShowBackendError(false)}
      />
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center space-x-2 mb-4">
        <span className="text-2xl">📱</span>
        <h2 className="text-xl font-bold text-gray-800">Send SMS Invitation</h2>
      </div>
      
      <p className="text-gray-600 mb-6">
        Send an SMS invitation to a new employee. They'll receive a registration link via text message.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Phone Number */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number *
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="+233241234567"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.phone ? 'border-red-500' : 'border-gray-300'
            }`}
            required
            disabled={loading}
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Include country code (e.g., +233 for Ghana)
          </p>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address (Optional)
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="employee@company.com"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={loading}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Will be auto-generated if not provided
          </p>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-white font-medium transition-colors ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Sending SMS...</span>
              </>
            ) : (
              <>
                <span>📤</span>
                <span>Send SMS Invitation</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <span className="text-blue-500 mt-0.5">ℹ️</span>
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">How it works:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Employee receives an SMS with a registration link</li>
              <li>They click the link and complete their account setup</li>
              <li>They can immediately start using the system</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}