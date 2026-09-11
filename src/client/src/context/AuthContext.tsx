import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { getApiUrl, safeFetchJson } from '../config/api';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuthToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshAuthToken = async (): Promise<string | null> => {
    try {
      const data = await safeFetchJson('/api/auth/refresh', { method: 'POST' });
      if (!data?.accessToken) {
        setUser(null);
        setAccessToken(null);
        return null;
      }

      setAccessToken(data.accessToken);

      const meData = await safeFetchJson('/api/auth/me', {
        headers: { Authorization: `Bearer ${data.accessToken}` },
      });

      if (meData?.user) {
        setUser(meData.user);
      }

      return data.accessToken;
    } catch (err) {
      setUser(null);
      setAccessToken(null);
      return null;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      await refreshAuthToken();
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await safeFetchJson('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setAccessToken(data.accessToken);
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await fetch(getApiUrl('/api/auth/logout'), { method: 'POST' });
    } catch (e) {
      console.error(e);
    } finally {
      setUser(null);
      setAccessToken(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, logout, refreshAuthToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
