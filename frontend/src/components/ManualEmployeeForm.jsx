import React, { useState } from 'react';
import { createEmployeeManually } from '../utils/services';
import { validateEmployeeForm, formatPhoneNumber } from '../utils/validation';
import { BackendNotImplemented } from './TemporaryFallback';

export default function ManualEmployeeForm({ onSuccess, onError, onCredentialsGenerated, prefillData = null }) {
  const [form, setForm] = useState({
    username: '',
    firstName: '',
    lastName: '',
    phone: prefillData?.phone || '',
    email: prefillData?.email || '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
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
    const validation = validateEmployeeForm(form, 'manual');
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const result = await createEmployeeManually({
        username: form.username,
        first_name: form.firstName,  // Map to backend field name
        last_name: form.lastName,    // Map to backend field name
        phone: form.phone,
        email: form.email,
        password: form.password
      });
      
      // Show credentials modal
      if (result.login_credentials) {
        onCredentialsGenerated?.({
          username: result.login_credentials.username,
          password: result.login_credentials.password,
          email: result.login_credentials.email,
          smsStatus: result.sms_sent
        });
      }
      
      onSuccess?.('Employee account created successfully! 🎉');
      
      // Reset form
      setForm({
        username: '',
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        password: ''
      });
    } catch (error) {
      
      // Check if it's a 404 (backend not implemented)
      if (error.response?.status === 404) {
        setShowBackendError(true);
        return;
      }
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail || 
                          'Failed to create employee account';
      onError?.(errorMessage, 'error');
      
      // Handle specific validation errors from backend
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  // Show backend not implemented message
  if (showBackendError) {
    return (
      <BackendNotImplemented 
        feature="Manual Employee Creation"
        endpoint="POST /api/authentication/create-employee/"
        onClose={() => setShowBackendError(false)}
      />
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center space-x-2 mb-4">
        <span className="text-2xl">👤</span>
        <h2 className="text-xl font-bold text-gray-800">Create Employee Account</h2>
      </div>
      
      <p className="text-gray-600 mb-6">
        Manually create an employee account. Login credentials will be generated and can be shared securely.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Username *
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="employee_username"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.username ? 'border-red-500' : 'border-gray-300'
            }`}
            required
            disabled={loading}
          />
          {errors.username && (
            <p className="mt-1 text-sm text-red-600">{errors.username}</p>
          )}
        </div>

        {/* First Name and Last Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              placeholder="John"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.firstName ? 'border-red-500' : 'border-gray-300'
              }`}
              required
              disabled={loading}
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
            )}
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              placeholder="Doe"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.lastName ? 'border-red-500' : 'border-gray-300'
              }`}
              required
              disabled={loading}
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
            )}
          </div>
        </div>

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
            placeholder="john.doe@company.com"
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

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password (Optional)
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Will generate secure password if empty"
              className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? '👁️' : '🙈'}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            A secure password will be generated if not provided
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
                : 'bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>➕</span>
                <span>Create Employee Account</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Info Box */}
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <span className="text-amber-500 mt-0.5">⚠️</span>
          <div className="text-sm text-amber-700">
            <p className="font-medium mb-1">Security Reminder:</p>
            <p>After account creation, you'll receive login credentials that must be shared securely with the employee. Consider using encrypted communication methods.</p>
          </div>
        </div>
      </div>
    </div>
  );
}