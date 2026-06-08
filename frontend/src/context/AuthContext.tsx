import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { api } from '../api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  googleLogin: (credential: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.auth.me()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const googleLogin = async (credential: string) => {
    const response = await api.auth.google(credential);
    localStorage.setItem('token', response.access_token);
    const userData = await api.auth.me();
    setUser(userData);
  };

  const login = async (email: string, password: string) => {
    const response = await api.auth.login({ email, password });
    localStorage.setItem('token', response.access_token);
    const userData = await api.auth.me();
    setUser(userData);
  };

  const register = async (email: string, password: string, name: string) => {
    const response = await api.auth.register({ email, password, name, role: 'USER' });
    localStorage.setItem('token', response.access_token);
    const userData = await api.auth.me();
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, googleLogin, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}