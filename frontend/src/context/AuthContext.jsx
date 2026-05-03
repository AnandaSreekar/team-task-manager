import { createContext, useContext, useState, useEffect } from 'react';
import { login as loginApi, register as registerApi, getMe } from '../api/auth.api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  console.log('AuthContext init - token exists:', !!localStorage.getItem('token'));

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        try {
          const res = await getMe();
          setUser(res.data.data);
          setToken(savedToken);
          localStorage.setItem('user', JSON.stringify(res.data.data));
        } catch (err) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await loginApi(email, password);
    const { token: newToken, data } = res.data;
    const receivedUser = data.user || data;
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(receivedUser));
    setToken(newToken);
    setUser(receivedUser);
    return res;
  };

  const register = async (name, email, password) => {
    const res = await registerApi(name, email, password);
    const { token: newToken, data } = res.data;
    const receivedUser = data.user || data;
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(receivedUser));
    setToken(newToken);
    setUser(receivedUser);
    return res;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
