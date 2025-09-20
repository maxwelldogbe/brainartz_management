import { useEffect, useState } from "react";
import axios from "../utils/axios";
import { useAuth } from "../context/AuthContext";
import AdminDashboard from './AdminDashboard';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [profile, setProfile] = useState({ phone: '', bio: '', avatar: '' });
  const [editing, setEditing] = useState(false);
  const { refreshUser, user } = useAuth();

  useEffect(() => {
    axios.get('/api/services/summary/daily/').then(res => setSummary(res.data)).catch(() => setSummary(null));
    // load profile
    axios.get('/api/auth/profile/').then(res => setProfile(res.data)).catch(() => {});
  }, []);

  const saveProfile = async () => {
    try {
      await axios.put('/api/auth/profile/', profile);
  setEditing(false);
  // refresh user in context
  try { await refreshUser(); } catch { /* ignore */ }
    } catch (err) {
      console.error('Failed to save profile', err);
    }
  };

  if (!summary) return <p>Loading dashboard...</p>;

  // If admin, render admin dashboard on the right
  if (user && user.is_admin) {
    return (
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <h1 className="text-2xl font-bold mb-4">Daily Summary</h1>
          <ul className="space-y-2 mb-6">
            <li>Date: {summary.date}</li>
            <li>Total Works Done: {summary.total_works_done}</li>
            <li>Incomplete Works: {summary.incomplete_works}</li>
            <li>Revenue Today: ${summary.revenue_today}</li>
          </ul>

          <div className="p-4 bg-white rounded shadow">
            <h2 className="font-semibold mb-2">Your Profile</h2>
            {editing ? (
              <div>
                <input value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} className="border p-2 mb-2 w-full" placeholder="Phone" />
                <textarea value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} className="border p-2 mb-2 w-full" placeholder="Bio" />
                <input value={profile.avatar} onChange={e => setProfile({ ...profile, avatar: e.target.value })} className="border p-2 mb-2 w-full" placeholder="Avatar URL" />
                <div>
                  <button onClick={saveProfile} className="bg-blue-600 text-white px-3 py-1 rounded mr-2">Save</button>
                  <button onClick={() => setEditing(false)} className="bg-gray-400 text-white px-3 py-1 rounded">Cancel</button>
                </div>
              </div>
            ) : (
              <div>
                <p><strong>Phone:</strong> {profile.phone || '—'}</p>
                <p><strong>Bio:</strong> {profile.bio || '—'}</p>
                <p><strong>Avatar:</strong> {profile.avatar ? <img src={profile.avatar} alt="avatar" className="w-16 h-16 rounded" /> : '—'}</p>
                <button onClick={() => setEditing(true)} className="mt-2 bg-blue-600 text-white px-3 py-1 rounded">Edit Profile</button>
              </div>
            )}
          </div>
        </div>

        <div className="col-span-1">
          <AdminDashboard />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Daily Summary</h1>
      <ul className="space-y-2 mb-6">
        <li>Date: {summary.date}</li>
        <li>Total Works Done: {summary.total_works_done}</li>
        <li>Incomplete Works: {summary.incomplete_works}</li>
        <li>Revenue Today: ${summary.revenue_today}</li>
      </ul>

      <div className="p-4 bg-white rounded shadow">
        <h2 className="font-semibold mb-2">Your Profile</h2>
        {editing ? (
          <div>
            <input value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} className="border p-2 mb-2 w-full" placeholder="Phone" />
            <textarea value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} className="border p-2 mb-2 w-full" placeholder="Bio" />
            <input value={profile.avatar} onChange={e => setProfile({ ...profile, avatar: e.target.value })} className="border p-2 mb-2 w-full" placeholder="Avatar URL" />
            <div>
              <button onClick={saveProfile} className="bg-blue-600 text-white px-3 py-1 rounded mr-2">Save</button>
              <button onClick={() => setEditing(false)} className="bg-gray-400 text-white px-3 py-1 rounded">Cancel</button>
            </div>
          </div>
        ) : (
          <div>
            <p><strong>Phone:</strong> {profile.phone || '—'}</p>
            <p><strong>Bio:</strong> {profile.bio || '—'}</p>
            <p><strong>Avatar:</strong> {profile.avatar ? <img src={profile.avatar} alt="avatar" className="w-16 h-16 rounded" /> : '—'}</p>
            <button onClick={() => setEditing(true)} className="mt-2 bg-blue-600 text-white px-3 py-1 rounded">Edit Profile</button>
          </div>
        )}
      </div>
    </div>
  );
}
