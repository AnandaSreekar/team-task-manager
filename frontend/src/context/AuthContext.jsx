import { createContext, useContext, useState, useEffect } from 'react';
import { login as loginApi, register as registerApi, getMe as apiGetMe } from '../api/auth.api';

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
    const response = await loginApi(email, password);
    const { token, data } = response.data;
    localStorage.setItem('token', token);
    setToken(token);
    setUser(data.user || data);
    return response;
  };

  const register = async (name, email, password) => {
    const response = await registerApi(name, email, password);
    const { token, data } = response.data;
    localStorage.setItem('token', token);
    setToken(token);
    setUser(data.user || data);
    return response;
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
