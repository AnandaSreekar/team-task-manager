import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const navItems = [
  { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { to: '/projects',  icon: '📁', label: 'Projects' },
  { to: '/tasks',     icon: '✅', label: 'Tasks' },
];

const adminItems = [
  { to: '/users',     icon: '👥', label: 'Users' },
];

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const { toast } = useToast?.() || {};
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const avatarColors = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b'];
  const colorIdx = user?.name?.charCodeAt(0) % avatarColors.length || 0;

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
          }}>⚡</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'white' }}>TaskFlow</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-muted)' }}>Team Manager</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Main nav */}
        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--color-muted)', padding: '8px 4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Navigation
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
          >
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}

        {/* Admin nav */}
        {isAdmin && (
          <>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--color-muted)', padding: '16px 4px 8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Admin
            </div>
            {adminItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
              >
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </>
        )}
      </div>

      {/* User profile */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid var(--color-border)' }}>
        <NavLink to="/profile" className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`} style={{ marginBottom: 4 }}>
          <div
            className="avatar"
            style={{ background: avatarColors[colorIdx], width: 32, height: 32, fontSize: '0.75rem' }}
          >
            {initials}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name}
            </div>
            <div style={{ display: 'inline-block', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: user?.role === 'ADMIN' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(148, 163, 184, 0.2)', color: user?.role === 'ADMIN' ? '#818cf8' : '#94a3b8', marginTop: '2px', fontWeight: 600, letterSpacing: '0.05em' }}>
              {user?.role}
            </div>
          </div>
        </NavLink>
        <button
          onClick={handleLogout}
          className="sidebar-nav-item"
          style={{ width: '100%', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
        >
          <span style={{ fontSize: 18 }}>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
