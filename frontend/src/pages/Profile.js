import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import '../styles/Profile.css';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

async function apiCall(path, method, body) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function Profile() {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();

  const isLocal = user?.provider !== 'google';

  const [editingProfile, setEditingProfile] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const handleLogout = () => {
    if (globalThis.confirm('Are you sure you want to logout?')) {
      logout();
      toast.success('Logged out successfully');
      navigate('/login');
    }
  };

  const handleDeleteAccount = () => {
    if (globalThis.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      toast.success('Account deleted successfully');
      logout();
      navigate('/login');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    setSavingProfile(true);
    try {
      const data = await apiCall('/auth/profile', 'PUT', { name });
      if (setUser) setUser(data.user);
      toast.success('Profile updated successfully');
      setEditingProfile(false);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    setSavingPassword(true);
    try {
      await apiCall('/auth/change-password', 'PUT', { currentPassword, newPassword });
      toast.success('Password changed successfully');
      setChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="profile-container">
      {/* Header */}
      <div className="profile-header">
        <button className="btn-back" onClick={() => navigate('/dashboard')} title="Back to Dashboard">
          ← Back
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
            <span className="info-label">Name</span>
            <div className="info-value">{user?.name || 'N/A'}</div>
          </div>

          <div className="info-group">
            <span className="info-label">Email</span>
            <div className="info-value">{user?.email || 'N/A'}</div>
          </div>

          <div className="info-group">
            <span className="info-label">Provider</span>
            <div className="info-value provider-badge">
              {user?.provider === 'google' ? '🔵 Google' : '📧 Email'}
            </div>
          </div>

          <div className="info-group">
            <span className="info-label">Account Status</span>
            <div className="info-value">
              <span className="status-badge active">✅ Active</span>
            </div>
          </div>

          <div className="info-group">
            <span className="info-label">Member Since</span>
            <div className="info-value">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </div>

        {/* Edit Profile inline form */}
        {editingProfile && (
          <form className="inline-form" onSubmit={handleSaveProfile}>
            <h3>Edit profile</h3>
            <label htmlFor="profile-name">Full name</label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
            />
            <div className="inline-form-actions">
              <button type="submit" className="btn-save" disabled={savingProfile}>
                {savingProfile ? 'Saving…' : 'Save changes'}
              </button>
              <button
                type="button"
                className="btn-cancel-inline"
                onClick={() => { setEditingProfile(false); setName(user?.name || ''); }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Change Password inline form — local accounts only */}
        {changingPassword && isLocal && (
          <form className="inline-form" onSubmit={handleSavePassword}>
            <h3>Change password</h3>
            <label htmlFor="current-password">Current password</label>
            <input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <label htmlFor="new-password">New password</label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 6 characters"
              required
            />
            <label htmlFor="confirm-new-password">Confirm new password</label>
            <input
              id="confirm-new-password"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="Repeat new password"
              required
            />
            <div className="inline-form-actions">
              <button type="submit" className="btn-save" disabled={savingPassword}>
                {savingPassword ? 'Saving…' : 'Update password'}
              </button>
              <button
                type="button"
                className="btn-cancel-inline"
                onClick={() => {
                  setChangingPassword(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmNewPassword('');
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Actions */}
        {!editingProfile && !changingPassword && (
          <div className="profile-actions">
            <button className="btn-edit" onClick={() => setEditingProfile(true)}>
              ✏️ Edit Profile
            </button>

            {isLocal ? (
              <button className="btn-change-password" onClick={() => setChangingPassword(true)}>
                🔒 Change Password
              </button>
            ) : (
              <>
                <button className="btn-change-password" disabled title="Not available for Google accounts">
                  🔒 Change Password
                </button>
                <div className="google-note">
                  Your account uses Google Sign-In, so there's no password to manage here — head to your{' '}
                  <a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer">
                    Google Account settings
                  </a>{' '}
                  if you need to update anything on that side.
                </div>
              </>
            )}
          </div>
        )}

        {/* Danger Zone */}
        <div className="danger-zone">
          <h3>⚠️ Danger Zone</h3>
          <button className="btn-logout" onClick={handleLogout}>
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