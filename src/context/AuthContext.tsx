import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  loginAs: (name: string, email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.getProfile();
      if (res.success && res.user) {
        setUser(res.user);
      }
    } catch (e) {
      console.error('Failed to load profile:', e);
      // Fallback user
      setUser({
        id: 'user_1',
        name: 'பயனர் (User)',
        email: 'user@example.com',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        role: 'நிர்வகிப்பவர் (Admin)',
        created_at: new Date().toISOString(),
        language: 'ta',
        theme: 'light',
        autoSaveInterval: 2,
        fontSize: 'medium',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const updateUserProfile = async (updates: Partial<User>) => {
    try {
      const res = await api.updateProfile(updates);
      if (res.success) {
        setUser(res.user);
      }
    } catch (e) {
      console.error('Failed to update profile:', e);
    }
  };

  const loginAs = async (name: string, email: string) => {
    await updateUserProfile({ name, email });
  };

  return (
    <AuthContext.Provider value={{ user, loading, updateUserProfile, loginAs }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
