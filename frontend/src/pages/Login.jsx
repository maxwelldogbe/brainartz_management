import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../utils/auth';
import Alert from '../components/Alert';
import NetworkDiagnostic from '../components/NetworkDiagnostic';

export default function Login() {
    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { isAuthenticated, login, user, loading: authLoading } = useAuth();

    // Only redirect if user is already fully authenticated
    useEffect(() => {
        if (isAuthenticated && user && !authLoading) {
            console.log('User already authenticated, redirecting...');
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, user, authLoading, navigate]);

    const handleChange = e => {
        setForm({ ...form, [e.target.name]: e.target.value });
        // Clear error when user starts typing
        if (error) setError(null);
    };

    const handleSubmit = async e => {
        e.preventDefault();
        
        if (!form.email || !form.password) {
            setError('Please enter both email and password');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log('Attempting login with:', { email: form.email, password: '***' });
            
            // Step 1: Get tokens from backend
            const { access, refresh } = await loginUser(form.email, form.password);
            console.log('Login API successful, tokens received');
            
            // Step 2: Set tokens and fetch user data
            const userData = await login(access, refresh);
            console.log('User data loaded successfully:', userData);
            
            // Step 3: Navigate based on user role
            if (userData) {
                console.log('Redirecting user after successful login');
                // Let the ProtectedRoute handle the smart redirection
                navigate('/', { replace: true });
            } else {
                throw new Error('User data not loaded properly');
            }
            
        } catch (error) {
            console.error('Login failed:', error);
            
            let errorMessage = 'Login failed. Please try again.';
            
            if (error.response) {
                // Server responded with error status
                if (error.response.status === 401) {
                    errorMessage = 'Invalid email or password';
                } else if (error.response.data?.detail) {
                    errorMessage = error.response.data.detail;
                } else if (error.response.data?.non_field_errors) {
                    errorMessage = error.response.data.non_field_errors[0];
                }
            } else if (error.request) {
                // Network error
                errorMessage = 'Unable to connect to server. Please check your connection.';
            } else if (error.message) {
                // Custom error from login function
                errorMessage = error.message;
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Show loading while checking existing authentication
    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Checking authentication...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <div className="text-center">
                        <div className="text-6xl mb-4">🎯</div>
                        <h2 className="text-3xl font-extrabold text-gray-900">
                            Sign in to your account
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Brainartz Management System
                        </p>
                    </div>
                </div>
                
                {/* Network Diagnostic Tool */}
                <NetworkDiagnostic />

                <form className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow" onSubmit={handleSubmit}>
                    {/* Error Alert */}
                    {error && (
                        <Alert type="error" onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="Enter your email"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Enter your password"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>

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
                                    <span>Signing in...</span>
                                </div>
                            ) : (
                                'Sign in'
                            )}
                        </button>
                    </div>

                    <div className="text-center text-sm text-gray-600">
                        Need help? Contact your administrator
                    </div>
                </form>
            </div>
        </div>
    );
}
