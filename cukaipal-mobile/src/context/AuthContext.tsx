import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, TABLES } from '../config/supabase';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import { Platform } from 'react-native';

interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  subscriptionStatus: 'trial' | 'active' | 'expired' | 'none';
  subscriptionPlan?: 'monthly' | 'yearly';
  trialEndsAt?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasActiveSubscription: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
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

// Configure Google Sign In
GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com', // From Google Console
  iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com', // From Google Console
});

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check current session
    checkSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await loadUserProfile(session.user.id);
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        await loadUserProfile(session.user.id);
      }
    } catch (error) {
      console.error('Session check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.USER_PROFILES)
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 means no rows, so create a new profile
        const newProfile = await createUserProfile(userId);
        setUser(newProfile);
        return;
      }

      if (data) {
        setUser({
          id: data.id,
          email: data.email || '',
          displayName: data.display_name || 'User',
          subscriptionStatus: data.subscription_status || 'trial',
          subscriptionPlan: data.subscription_plan,
          trialEndsAt: data.trial_ends_at,
        });
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  const createUserProfile = async (userId: string): Promise<UserProfile> => {
    // Get user email from auth
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7); // 7-day trial

    const profile = {
      id: userId,
      display_name: authUser?.user_metadata?.full_name || 'User',
      subscription_status: 'trial',
      trial_ends_at: trialEndsAt.toISOString(),
    };

    await supabase.from(TABLES.USER_PROFILES).insert(profile);

    return {
      id: userId,
      email: authUser?.email || '',
      displayName: profile.display_name,
      subscriptionStatus: 'trial',
      trialEndsAt: profile.trial_ends_at,
    };
  };

  const signInWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      if (userInfo.data?.idToken) {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: userInfo.data.idToken,
        });

        if (error) throw error;
      }
    } catch (error: any) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  const signInWithApple = async () => {
    try {
      if (Platform.OS !== 'ios') {
        throw new Error('Apple Sign In is only available on iOS');
      }

      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      const { identityToken, nonce } = appleAuthRequestResponse;

      if (!identityToken) {
        throw new Error('Apple Sign In failed - no identity token');
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: identityToken,
        nonce,
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Apple sign in error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      if (Platform.OS === 'android') {
        await GoogleSignin.signOut();
      }
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshUser = async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (authUser) {
      await loadUserProfile(authUser.id);
    }
  };

  const isAuthenticated = !!user;
  const hasActiveSubscription =
    user?.subscriptionStatus === 'active' || user?.subscriptionStatus === 'trial';

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    hasActiveSubscription,
    signInWithGoogle,
    signInWithApple,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
