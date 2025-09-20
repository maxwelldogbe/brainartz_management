import { useEffect, useState } from 'react';
import { fetchWorkers, deleteUser, toggleUserActive } from '../utils/services';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Workers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workers, setWorkers] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  if (!user) return; // wait for user info
  if (!user.is_admin) {
      // Not an admin - redirect to appropriate dashboard
      navigate('/', { replace: true });
      return;
    }

    load();
  }, [user, navigate]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchWorkers();
      setWorkers(data);
    } catch (err) {
      console.error('Failed to load workers', err);
      setWorkers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    try {
      await deleteUser(id);
      setWorkers(workers.filter(w => w.id !== id));
    } catch (err) {
      console.error('Failed to delete user', err);
      alert('Failed to delete user');
    }
  };

  const handleToggle = async (id, active) => {
    try {
      await toggleUserActive(id, !active);
      setWorkers(workers.map(w => w.id === id ? { ...w, is_active: !active } : w));
    } catch (err) {
      console.error('Failed to update user active state', err);
      alert('Failed to update user state');
    }
  };

  if (loading) return <div>Loading workers...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Employees</h1>
      <div className="p-4 bg-white rounded shadow">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="pb-2">Name</th>
              <th className="pb-2">Email</th>
              <th className="pb-2">Phone</th>
              <th className="pb-2">Role</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {workers && workers.length === 0 && (
              <tr><td colSpan={6}>No employees found.</td></tr>
            )}
            {workers && workers.map(w => (
              <tr key={w.id} className="border-t">
                <td className="py-2">{w.first_name} {w.last_name}</td>
                <td className="py-2">{w.email}</td>
                <td className="py-2">{w.profile?.phone || '—'}</td>
                <td className="py-2">{w.is_admin ? 'Admin' : (w.is_worker ? 'Employee' : 'User')}</td>
                <td className="py-2">{w.is_active ? 'Active' : 'Disabled'}</td>
                <td className="py-2 space-x-2">
                  <button onClick={() => handleToggle(w.id, w.is_active)} className="bg-yellow-500 text-white px-2 py-1 rounded">
                    {w.is_active ? 'Hold' : 'Enable'}
                  </button>
                  <button onClick={() => handleDelete(w.id)} className="bg-red-600 text-white px-2 py-1 rounded">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
