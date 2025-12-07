import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { registerUserFromToken } from '../utils/auth';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';

export default function Register() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { login, refreshUser } = useAuth();
  const [form, setForm] = useState({ 
    username: '', 
    password: '', 
    re_password: '',
    firstName: '',
    lastName: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInvited, setIsInvited] = useState(false);

  useEffect(() => {
    if (token) {
      setIsInvited(true);
      // You might want to validate the token here
      // For now, we assume it's valid if present
    }
  }, [token]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    
    // Validate token exists for invited registration
    if (isInvited && !token) {
      setError('Invalid registration link - missing token');
      return;
    }

    // Validate passwords match
    if (form.password !== form.re_password) {
      setError("Passwords don't match");
      return;
    }

    // Validate required fields
    if (!form.username.trim()) {
      setError('Username is required');
      return;
    }

    if (!form.email.trim()) {
      setError('Email is required');
      return;
    }

    if (!form.password.trim()) {
      setError('Password is required');
      return;
    }

    if (!isInvited) {
      // For regular registration, require additional fields
      if (!form.firstName.trim() || !form.lastName.trim()) {
        setError('First name and last name are required');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      let data;
      
      if (isInvited) {
        // Token-based registration (invited users)
        data = await registerUserFromToken(
          token,
          form.username,
          form.email,
          form.password,
          form.re_password
        );
      } else {
        // Regular registration (future implementation)
        setError('Regular registration is not available. Please use invitation link.');
        setLoading(false);
        return;
      }

      // Use context login to set tokens and fetch user
      await login(data.access, data.refresh);
      // Refresh global user state
      await refreshUser();
      navigate('/');
    } catch (err) {
      const detail = err.response?.data?.error || 
                    err.response?.data?.detail || 
                    err.message ||
                    'Registration failed.';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
            <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              {isInvited ? 'Complete Your Registration' : 'Create Account'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {isInvited 
                ? "You've been invited to join the team. Complete your account setup below."
                : 'Join our management system'
              }
            </p>
          </div>
        </div>

        <form className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow" onSubmit={handleSubmit}>
          {/* Success Alert for Invited Users */}
          {isInvited && (
            <Alert type="success" title="Welcome aboard!">
              You've been invited to join the team. Complete the form below to activate your account.
            </Alert>
          )}

          {/* Error Alert */}
          {error && (
            <Alert type="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <div className="space-y-4">
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
                placeholder="Choose a username"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Create a secure password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={loading}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="re_password" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password *
              </label>
              <input
                type="password"
                id="re_password"
                name="re_password"
                value={form.re_password}
                onChange={handleChange}
                placeholder="Repeat your password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={loading}
              />
            </div>

            {/* Email field - Required for login */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                You'll use this email to log in to your account
              </p>
            </div>

            {/* Additional fields for non-invited users */}
            {!isInvited && (
              <>
                <div className="grid grid-cols-2 gap-4">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required={!isInvited}
                      disabled={loading}
                    />
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required={!isInvited}
                      disabled={loading}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Setting up account...</span>
                </div>
              ) : (
                <span>
                  {isInvited ? 'Complete Registration' : 'Create Account'}
                </span>
              )}
            </button>
          </div>

          {/* Instructions for invited users */}
          {isInvited && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Registration Tips:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Enter your email address (you'll use this to log in)</li>
                    <li>Choose a memorable username</li>
                    <li>Create a strong password with at least 8 characters</li>
                    <li>You can update your profile after first login</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Login Link */}
          <div className="text-center">
            <span className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/portal/login')}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign in here
              </button>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
