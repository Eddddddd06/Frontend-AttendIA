import { createContext, useContext, useState, useEffect } from 'react';
import { logoutUsuario } from '../api/endpoints';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('attendia_user');
    const savedToken = localStorage.getItem('attendia_token');
    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('attendia_user');
        localStorage.removeItem('attendia_token');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    const { token, ...userInfo } = userData;
    localStorage.setItem('attendia_token', token);
    localStorage.setItem('attendia_user', JSON.stringify(userInfo));
    setUser(userInfo);
  };

  const logout = async () => {
    try {
      await logoutUsuario();
    } catch {
    }
    localStorage.removeItem('attendia_token');
    localStorage.removeItem('attendia_user');
    setUser(null);
  };

  const isAdmin = user?.rol === 'admin';
  const isEmployee = user?.rol === 'empleado';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isEmployee }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
