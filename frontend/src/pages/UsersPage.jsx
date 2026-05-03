import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function UsersPage() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async (q = '') => {
    setLoading(true);
    try {
      const { data } = await api.get(`/users?search=${q}`);
      setUsers(data.data.users);
    } catch {
      toast.error('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => {
    const t = setTimeout(() => fetchUsers(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success('User deleted.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const avatarColors = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b'];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Users</h1>
        <p className="page-subtitle">Manage all team members and their roles</p>
      </div>

      <div style={{ marginBottom: 20 }}>
        <input
          type="search"
          className="form-input"
          placeholder="🔍  Search users by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 380 }}
        />
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
          <div className="spinner" style={{ width: 40, height: 40 }} />
        </div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <span style={{ fontSize: 48 }}>👥</span>
          <h3 style={{ margin: 0, color: 'white' }}>No users found</h3>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Projects</th>
                <th>Tasks</th>
                <th>Joined</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const color = avatarColors[u.name?.charCodeAt(0) % avatarColors.length];
                const initials = u.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="avatar" style={{ background: color }}>{initials}</div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'white' }}>{u.name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-muted)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${u.role === 'ADMIN' ? 'badge-admin' : 'badge-member'}`}>{u.role}</span>
                    </td>
                    <td style={{ color: 'white', fontWeight: 600 }}>{u._count?.projectsCreated ?? 0}</td>
                    <td style={{ color: 'white', fontWeight: 600 }}>{u._count?.tasksAssigned ?? 0}</td>
                    <td style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>
                      {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    {isAdmin && (
                      <td>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id)}>
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
