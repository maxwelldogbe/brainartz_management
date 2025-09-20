import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { registerUserFromToken } from '../utils/auth';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { login, refreshUser } = useAuth();
  const [form, setForm] = useState({ username: '', password: '', re_password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    
    // Validate token exists
    if (!token) {
      setError('Invalid registration link - missing token');
      return;
    }

    // Validate passwords match
    if (form.password !== form.re_password) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await registerUserFromToken(
        token, // Now using the actual token from URL
        form.username,
        form.password,
        form.re_password
      );

  // use context login to set tokens and fetch user
  login(data.access, data.refresh);
  // refresh global user state
  await refreshUser();
  navigate('/');
    } catch (err) {
      const detail = err.response?.data?.error || 
                    err.response?.data?.detail || 
                    'Registration failed.';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white p-6 rounded shadow"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Register Your Account</h2>
        {error && <div className="text-red-600 mb-4 text-sm">{error}</div>}

        <input
          type="text"
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
          className="w-full mb-4 px-3 py-2 border rounded"
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="w-full mb-4 px-3 py-2 border rounded"
          required
        />

        <input
          type="password"
          name="re_password"
          placeholder="Repeat Password"
          value={form.re_password}
          onChange={handleChange}
          className="w-full mb-4 px-3 py-2 border rounded"
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
}
