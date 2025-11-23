import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, AuthResponse, LoginCredentials, RegisterData } from '../services/authService';

interface AuthContextType {
  user: AuthResponse['user'] | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasActiveSubscription: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthResponse['user'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    const response = await authService.login(credentials);
    setUser(response.user);
  };

  const register = async (data: RegisterData) => {
    const response = await authService.register(data);
    setUser(response.user);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    const currentUser = await authService.getCurrentUser();
    setUser(currentUser);
  };

  const isAuthenticated = !!user;
  const hasActiveSubscription =
    user?.subscriptionStatus === 'active' || user?.subscriptionStatus === 'trial';

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    hasActiveSubscription,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
