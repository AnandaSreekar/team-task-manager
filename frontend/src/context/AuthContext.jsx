import { createContext, useContext, useState, useEffect } from 'react';
import { login as loginApi, register as registerApi, getMe } from '../api/auth.api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const storedToken = localStorage.getItem('token');
  const validToken = storedToken && storedToken !== 'undefined' && storedToken !== 'null' ? storedToken : null;
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser && storedUser !== 'undefined' ? JSON.parse(storedUser) : null;
  });
  const [token, setToken] = useState(validToken);
  const [loading, setLoading] = useState(true);

  console.log('AuthContext init - token exists:', !!validToken);

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (t === 'undefined' || t === 'null' || t === '') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    }
  }, []);

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
    // If backend returns { success, token, user } or { success, data: { token, user } }
    // Let's handle both just in case, but user said token and user are in res.data
    const token = res.data.token || res.data.data?.token;
    const user = res.data.user || res.data.data?.user;
    
    if (!token) throw new Error('No token received from server');
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setToken(token);
    setUser(user);
    return user;
  };

  const register = async (name, email, password) => {
    const res = await registerApi(name, email, password);
    const token = res.data.token || res.data.data?.token;
    const user = res.data.user || res.data.data?.user;
    
    if (!token) throw new Error('No token received from server');
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setToken(token);
    setUser(user);
    return user;
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
