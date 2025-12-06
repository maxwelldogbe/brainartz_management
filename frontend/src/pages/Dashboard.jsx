import { useEffect, useState } from "react";
import axios from "../utils/axios";
import { useAuth } from "../context/AuthContext";
import { useRoleAccess } from "../hooks/useRoleAccess";
import AdminDashboard from './AdminDashboard';
import SalesReportsSummary from '../components/SalesReportsSummary';
import { formatMoneyGHS } from "../utils/formatMoney";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [profile, setProfile] = useState({ phone: '', bio: '', avatar: null, avatar_url: null });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { refreshUser, user } = useAuth();
  const { canAccessAdminFeatures, canAccessWorkerFeatures, getUserRoleString } = useRoleAccess();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Only load summary if user has worker access
        if (canAccessWorkerFeatures) {
          try {
            const summaryRes = await axios.get('/api/services/summary/daily/');
            setSummary(summaryRes.data);
          } catch (err) {
            setSummary(null);
          }
        }
        
        // Load user profile
        try {
          const profileRes = await axios.get('/api/authentication/profile/');
          
          // Store profile data (avatar will be URL string when reading)
          const profileData = {
            phone: profileRes.data.phone || '',
            bio: profileRes.data.bio || '',
            avatar: profileRes.data.avatar || null, // This will be URL when reading
          };
          setProfile(profileData);
          setAvatarPreview(profileRes.data.avatar); // URL for preview
        } catch (err) {
          setProfile({ phone: '', bio: '', avatar: null });
        }
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user, canAccessWorkerFeatures]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProfile = async () => {
    try {
      const formData = new FormData();
      formData.append('phone', profile.phone || '');
      
      // Only append bio if it has a value
      if (profile.bio) {
        formData.append('bio', profile.bio);
      }
      
      // Only append avatar if a new file was selected
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }
      // If no new file is selected, don't include avatar field at all
      // (the backend will keep the existing avatar)

      // Let axios set the Content-Type header automatically with boundary
      await axios.put('/api/authentication/profile/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setEditing(false);
      setAvatarFile(null);
      
      // Reload profile to get updated avatar URL
      const profileRes = await axios.get('/api/authentication/profile/');
      const profileData = {
        phone: profileRes.data.phone || '',
        bio: profileRes.data.bio || '',
        avatar: profileRes.data.avatar || null,
      };
      setProfile(profileData);
      setAvatarPreview(profileRes.data.avatar);
      
      // refresh user in context
      try { 
        await refreshUser(); 
      } catch { 
        /* ignore */ 
      }
      
      alert('Profile updated successfully');
    } catch (err) {
      alert('Failed to save profile changes');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Dashboard Error</h2>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  // If admin, show combined dashboard
  if (canAccessAdminFeatures) {
    return (
      <div className="space-y-6 min-w-0">
      {/* //   <div>
      //     <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
      //     <p className="text-gray-600 mt-1">Complete system overview and management</p>
      //   </div>
         */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Personal Summary */}
          <div className="xl:col-span-1 space-y-6 min-w-0">
            <UserProfileSection 
              profile={profile}
              setProfile={setProfile}
              avatarPreview={avatarPreview}
              handleAvatarChange={handleAvatarChange}
              editing={editing}
              setEditing={setEditing}
              saveProfile={saveProfile}
              getUserRoleString={getUserRoleString}
            />
            
            {summary && (
              <PersonalSummaryCard summary={summary} />
            )}
            
            {/* Sales Reports Summary for admins */}
            <SalesReportsSummary />
          </div>

          {/* Admin Dashboard */}
          <div className="xl:col-span-2 min-w-0">
            <AdminDashboard />
          </div>
        </div>
      </div>
    );
  }

  // Regular user dashboard
  return (
    <div className="space-y-6 min-w-0">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, {user?.first_name}!</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Profile */}
        <UserProfileSection 
          profile={profile}
          setProfile={setProfile}
          avatarPreview={avatarPreview}
          handleAvatarChange={handleAvatarChange}
          editing={editing}
          setEditing={setEditing}
          saveProfile={saveProfile}
          getUserRoleString={getUserRoleString}
        />

        {/* Summary (if worker) */}
        {canAccessWorkerFeatures && summary && (
          <PersonalSummaryCard summary={summary} />
        )}

        {/* Sales Reports Summary (if worker) */}
        {canAccessWorkerFeatures && (
          <SalesReportsSummary />
        )}

        {/* Welcome message for non-workers */}
        {!canAccessWorkerFeatures && (
          <div className="bg-white rounded-lg shadow p-6 min-w-0">
            <div className="text-center">
              
              <h2 className="text-xl font-bold text-gray-800 mb-2">Welcome to Brainartz!</h2>
              <p className="text-gray-600">
                Your account has been set up successfully. Contact your administrator if you need additional access permissions.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// User Profile Section Component
function UserProfileSection({ profile, setProfile, avatarPreview, handleAvatarChange, editing, setEditing, saveProfile, getUserRoleString }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Your Profile</h2>
        <span className="mt-2 sm:mt-0 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
          {getUserRoleString()}
        </span>
      </div>
      
      {editing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input 
              value={profile.phone} 
              onChange={e => setProfile({ ...profile, phone: e.target.value })} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              placeholder="Phone number" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea 
              value={profile.bio || ''} 
              onChange={e => setProfile({ ...profile, bio: e.target.value })} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              placeholder="Tell us about yourself"
              rows="3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
            <div className="flex items-center gap-4">
              {avatarPreview && (
                <img src={avatarPreview} alt="Avatar preview" className="w-16 h-16 rounded-full object-cover" />
              )}
              <div className="flex-1">
                <input 
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                />
                <p className="text-xs text-gray-500 mt-1">Upload a profile picture (JPG, PNG, GIF - Max 5MB)</p>
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={saveProfile} 
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Changes
            </button>
            <button 
              onClick={() => setEditing(false)} 
              className="w-full sm:w-auto px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center space-x-4 flex-wrap">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="w-16 h-16 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0" />
            )}
            <div className="min-w-0">
              <div className="text-lg font-semibold text-gray-800 truncate">
                {profile.name || 'Update your profile'}
              </div>
              <div className="text-gray-600 truncate">{profile.bio || 'No bio added yet'}</div>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">
              <strong>Phone:</strong> {profile.phone || 'Not provided'}
            </p>
          </div>
          
          <button 
            onClick={() => setEditing(true)} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Edit Profile
          </button>
        </div>
      )}
    </div>
  );
}

// Personal Summary Card Component
function PersonalSummaryCard({ summary }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Daily Summary</h2>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Date:</span>
          <span className="font-medium">{summary.date}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Works Completed:</span>
          <span className="font-medium text-green-600">{summary.total_works_done}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Pending Works:</span>
          <span className="font-medium text-orange-600">{summary.incomplete_works}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Today's Revenue:</span>
          <span className="font-medium text-blue-600" title={`GH₵${parseFloat(summary.revenue_today || 0).toLocaleString()}`}>
            {formatMoneyGHS(parseFloat(summary.revenue_today || 0))}
          </span>
        </div>
      </div>
    </div>
  );
}
