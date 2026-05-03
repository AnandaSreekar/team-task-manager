import { createContext, useContext, useState, useEffect } from 'react';
import { login as loginApi, register as registerApi, getMe } from '../api/auth.api';

const AuthContext = createContext(null);

const getInitialToken = () => {
  const t = localStorage.getItem('token');
  if (!t || t === 'undefined' || t === 'null') {
    localStorage.removeItem('token');
    return null;
  }
  return t;
};

const getInitialUser = () => {
  try {
    const u = localStorage.getItem('user');
    if (!u || u === 'undefined') return null;
    return JSON.parse(u);
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(getInitialToken);
  const [user, setUser] = useState(getInitialUser);
  const [loading, setLoading] = useState(false);

  console.log('AuthContext init - token exists:', !!token);

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
    try {
      const res = await loginApi(email, password);
      const data = res.data;
      
      // Support both response shapes
      const token = data.token || data.data?.token;
      const user = data.user || data.data?.user;
      
      if (!token) throw new Error('No token in response');
      
      // STEP 1: Save to localStorage FIRST (synchronous)
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // STEP 2: Update React state
      setToken(token);
      setUser(user);
      
      return { token, user };
    } catch (error) {
      throw error;
    }
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
