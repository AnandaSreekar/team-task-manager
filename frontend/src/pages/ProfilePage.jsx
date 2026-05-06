import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
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
      // Backend returns data.user or similar
      const updatedUser = data.data?.user || data.user || data.data;
      updateUser(updatedUser);
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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ maxWidth: 700 }}>
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Profile Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account identity and security</p>
      </div>

      {/* Avatar Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 mb-8 flex items-center gap-6 shadow-sm">
        <div 
          className="w-20 h-20 rounded-3xl flex items-center justify-center text-2xl font-bold text-white shadow-lg" 
          style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }}
        >
          {initials}
        </div>
        <div>
          <div className="text-xl font-bold text-slate-800">{user?.name}</div>
          <div className="text-sm text-slate-500 font-medium">{user?.email}</div>
          <div className="mt-3 flex gap-2">
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${user?.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>
              {user?.role}
            </span>
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">
              Active Session
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Edit Profile */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-sm">👤</span>
            Identity Information
          </h2>
          <form onSubmit={handleProfile} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
              <input
                className="w-full bg-white text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your full name"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <input
                type="email"
                className="w-full bg-white text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@company.com"
                required
              />
            </div>
            <div className="flex justify-end pt-2">
              <button 
                type="submit" 
                className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-70 uppercase tracking-widest"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Update Identity'}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm mb-12">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center text-sm">🔐</span>
            Security Credentials
          </h2>
          <form onSubmit={handlePassword} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Current Password</label>
              <input
                type="password"
                className="w-full bg-white text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
                placeholder="••••••••"
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                <input
                  type="password"
                  className="w-full bg-white text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
                  placeholder="Min. 6 chars"
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                <input
                  type="password"
                  className="w-full bg-white text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
                  placeholder="••••••••"
                  value={pwForm.confirm}
                  onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button 
                type="submit" 
                className="px-8 py-3 bg-slate-800 text-white rounded-2xl font-bold text-xs hover:bg-slate-900 transition-all shadow-lg shadow-slate-100 disabled:opacity-70 uppercase tracking-widest"
                disabled={changingPw}
              >
                {changingPw ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
