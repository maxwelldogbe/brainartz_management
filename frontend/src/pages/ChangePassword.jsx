import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axios';
import Alert from '../components/Alert';

export default function ChangePassword() {
    const [form, setForm] = useState({
        old_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        if (error) setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!form.old_password || !form.new_password || !form.confirm_password) {
            setError('All fields are required');
            return;
        }

        if (form.new_password !== form.confirm_password) {
            setError('New passwords do not match');
            return;
        }

        if (form.new_password.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await axiosInstance.post('/auth/change-password/', {
                old_password: form.old_password,
                new_password: form.new_password,
                confirm_password: form.confirm_password
            });

            setSuccess(true);
            setForm({ old_password: '', new_password: '', confirm_password: '' });
            
            // Show success for 2 seconds then redirect to dashboard
            setTimeout(() => {
                navigate('/portal/dashboard');
            }, 2000);

        } catch (err) {
            
            let errorMessage = 'Failed to change password. Please try again.';
            
            if (err.response?.data) {
                if (err.response.data.old_password) {
                    errorMessage = err.response.data.old_password[0];
                } else if (err.response.data.new_password) {
                    errorMessage = err.response.data.new_password[0];
                } else if (err.response.data.confirm_password) {
                    errorMessage = err.response.data.confirm_password[0];
                } else if (err.response.data.non_field_errors) {
                    errorMessage = err.response.data.non_field_errors[0];
                } else if (err.response.data.detail) {
                    errorMessage = err.response.data.detail;
                }
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="mb-6">
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                Change Password
                            </h1>
                    <p className="text-gray-600 mt-2">
                        Update your password to keep your account secure
                    </p>
                </div>

                {success && (
                    <Alert type="success" onClose={() => setSuccess(false)}>
                        Password changed successfully! Redirecting to dashboard...
                    </Alert>
                )}

                {error && (
                    <Alert type="error" onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="old_password" className="block text-sm font-medium text-gray-700 mb-1">
                            Current Password
                        </label>
                        <input
                            type="password"
                            id="old_password"
                            name="old_password"
                            value={form.old_password}
                            onChange={handleChange}
                            placeholder="Enter your current password"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                            disabled={loading}
                            autoComplete="current-password"
                        />
                    </div>

                    <div className="border-t pt-6">
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-1">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    id="new_password"
                                    name="new_password"
                                    value={form.new_password}
                                    onChange={handleChange}
                                    placeholder="Enter your new password (min 8 characters)"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                    disabled={loading}
                                    autoComplete="new-password"
                                    minLength={8}
                                />
                            </div>

                            <div>
                                <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
                                    Confirm New Password
                                </label>
                                <input
                                    type="password"
                                    id="confirm_password"
                                    name="confirm_password"
                                    value={form.confirm_password}
                                    onChange={handleChange}
                                    placeholder="Confirm your new password"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                    disabled={loading}
                                    autoComplete="new-password"
                                    minLength={8}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-medium text-blue-900 mb-2">Password Requirements:</h3>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• At least 8 characters long</li>
                            <li>• Different from your current password</li>
                            <li>• Keep it secure and don't share with anyone</li>
                        </ul>
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`flex-1 py-3 px-4 rounded-lg font-medium text-white ${
                                loading
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                            }`}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    <span>Updating...</span>
                                </div>
                            ) : (
                                'Change Password'
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/portal/dashboard')}
                            disabled={loading}
                            className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
