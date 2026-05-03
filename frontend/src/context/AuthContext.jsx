import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, getMe as apiGetMe } from '../api/auth.api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      if (token) {
        try {
          const res = await apiGetMe();
          setUser(res.data.user);
        } catch (error) {
          console.error('Session restore failed:', error);
          logout(); // Clear invalid token
        }
      }
      setLoading(false);
    };

    restoreSession();
  }, [token]);

  const login = async (email, password) => {
    const res = await apiLogin(email, password);
    const { user: u, token: t } = res.data;
    localStorage.setItem('token', t);
    setToken(t);
    setUser(u);
    return u;
  };

  const register = async (name, email, password) => {
    const res = await apiRegister(name, email, password);
    const { user: u, token: t } = res.data;
    localStorage.setItem('token', t);
    setToken(t);
    setUser(u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
