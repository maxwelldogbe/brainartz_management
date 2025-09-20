import { useState } from 'react';
import { sendInvite } from '../utils/services';
import { useAuth } from '../context/AuthContext';

export default function Invite() {
  const { user } = useAuth();
  const [form, setForm] = useState({ email: '', phone: '' });
  const [msg, setMsg] = useState(null);

  if (!user || !user.is_admin) return <div>You must be an admin to send invites.</div>;

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSend = async e => {
    e.preventDefault();
    setMsg(null);
    try {
      const res = await sendInvite(form);
      setMsg('Invite sent. Link: ' + (res.invite_link || 'sent'));
    } catch (err) {
      console.error(err);
      setMsg('Failed to send invite');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Send Invite</h1>
      {msg && <div className="mb-4">{msg}</div>}
      <form onSubmit={handleSend} className="p-4 bg-white rounded shadow">
        <input name="email" value={form.email} onChange={handleChange} placeholder="Email (optional)" className="border p-2 mr-2 rounded w-full mb-2" />
        <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone (optional)" className="border p-2 mr-2 rounded w-full mb-2" />
        <button className="bg-blue-600 text-white px-3 py-1 rounded">Send Invite</button>
      </form>
    </div>
  );
}
