import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import '../styles/Profile.css';

function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      toast.success('Logged out successfully');
      navigate('/login');
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // TODO: Implement delete account API call
      toast.success('Account deleted successfully');
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="profile-container">
      {/* Header */}
      <div className="profile-header">
        <button
          className="btn-back"
          onClick={() => navigate('/dashboard')}
          title="Back to Dashboard"
        >
          ← Back to Dashboard
        </button>
        <h1>👤 User Profile</h1>
        <div></div>
      </div>

      {/* Profile Card */}
      <div className="profile-card">
        {/* Avatar */}
        <div className="profile-avatar">
          <div className="avatar-placeholder">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
        </div>

        {/* User Info */}
        <div className="profile-info">
          <div className="info-group">
            <label>Name</label>
            <div className="info-value">{user?.name || 'N/A'}</div>
          </div>

          <div className="info-group">
            <label>Email</label>
            <div className="info-value">{user?.email || 'N/A'}</div>
          </div>

          <div className="info-group">
            <label>Provider</label>
            <div className="info-value">
              {user?.provider === 'google' ? '🔵 Google' : '📧 Email'}
            </div>
          </div>

          <div className="info-group">
            <label>Account Status</label>
            <div className="info-value">
              <span className="status-badge active">✅ Active</span>
            </div>
          </div>

          <div className="info-group">
            <label>Member Since</label>
            <div className="info-value">
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : 'N/A'}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="profile-actions">
          <button
            className="btn-edit"
            disabled
            title="Coming soon"
          >
            ✏️ Edit Profile
          </button>
          <button
            className="btn-change-password"
            disabled
            title="Coming soon"
          >
            🔒 Change Password
          </button>
        </div>

        {/* Danger Zone */}
        <div className="danger-zone">
          <h3>⚠️ Danger Zone</h3>
          <button
            className="btn-logout"
            onClick={handleLogout}
          >
            🚪 Logout
          </button>
          <button
            className="btn-delete"
            onClick={handleDeleteAccount}
            disabled
            title="Coming soon"
          >
            🗑️ Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;
