import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const avatarColors = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b'];
  const color = avatarColors[user?.name?.charCodeAt(0) % avatarColors.length] || '#6366f1';
  const initials = user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  const handleProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.patch(`/users/${user.id}`, form);
      updateUser(data.data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) {
      toast.error('New passwords do not match.');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    setChangingPw(true);
    try {
      await api.patch('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 700 }}>
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Manage your account settings</p>
      </div>

      {/* Avatar Banner */}
      <div className="card" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
        <div className="avatar" style={{ width: 72, height: 72, fontSize: '1.5rem', background: color, flexShrink: 0 }}>
          {initials}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.2rem', color: 'white' }}>{user?.name}</div>
          <div style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>{user?.email}</div>
          <span className={`badge ${user?.role === 'ADMIN' ? 'badge-admin' : 'badge-member'}`} style={{ marginTop: 6 }}>
            {user?.role}
          </span>
        </div>
      </div>

      {/* Edit Profile */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 20px', fontSize: '1rem', fontWeight: 700 }}>✏️ Edit Profile</h2>
        <form onSubmit={handleProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              id="profile-name"
              className="form-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              id="profile-email"
              type="email"
              className="form-input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><span className="spinner" /> Saving...</> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="card">
        <h2 style={{ margin: '0 0 20px', fontSize: '1rem', fontWeight: 700 }}>🔐 Change Password</h2>
        <form onSubmit={handlePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input
              id="current-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              id="new-password"
              type="password"
              className="form-input"
              placeholder="Min. 6 characters"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input
              id="confirm-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={pwForm.confirm}
              onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
              required
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={changingPw}>
              {changingPw ? <><span className="spinner" /> Updating...</> : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
