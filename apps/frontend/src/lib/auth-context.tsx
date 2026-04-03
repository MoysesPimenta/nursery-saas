'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from './supabase/client';
import { api } from './api';

interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  tenantId?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true);
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);

          try {
            const response = await api<{ user: UserProfile }>('/api/v1/auth/me');
            setUserProfile(response.user || response as unknown as UserProfile);
          } catch (err) {
            console.error('Failed to fetch user profile:', err);
            // Set a minimal profile from the session so the app doesn't break
            setUserProfile({
              id: currentSession.user.id,
              email: currentSession.user.email || '',
              role: currentSession.user.user_metadata?.role || 'read_only',
            });
          }
        }

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, newSession) => {
          setSession(newSession);
          setUser(newSession?.user || null);

          if (newSession?.user) {
            try {
              const response = await api<{ user: UserProfile }>('/api/v1/auth/me');
              setUserProfile(response.user || response as unknown as UserProfile);
            } catch (err) {
              console.error('Failed to fetch user profile:', err);
              // Set a minimal profile from the session so the app doesn't break
              setUserProfile({
                id: newSession.user.id,
                email: newSession.user.email || '',
                role: newSession.user.user_metadata?.role || 'read_only',
              });
            }
          } else {
            setUserProfile(null);
          }
        });

        return () => subscription.unsubscribe();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Auth initialization failed');
        setError(error);
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    const cleanup = initAuth();
    return () => {
      cleanup.then((unsub) => unsub?.());
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Sign in failed');
      setError(error);
      throw error;
    }
  };

  const signUp = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => {
    try {
      setError(null);
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Sign up failed');
      setError(error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      const { error: signOutError } = await supabase.auth.signOut();

      // Clear local state even if API fails
      setUser(null);
      setSession(null);
      setUserProfile(null);

      if (signOutError) {
        throw signOutError;
      }
    } catch (err) {
      // Still clear state on error, but set error message
      setUser(null);
      setSession(null);
      setUserProfile(null);
      const error = err instanceof Error ? err : new Error('Sign out failed');
      setError(error);
      throw error;
    }
  };

  const refreshSession = async () => {
    try {
      setError(null);
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();

      if (refreshError) {
        throw refreshError;
      }

      if (refreshedSession) {
        setSession(refreshedSession);
        setUser(refreshedSession.user);

        try {
          const response = await api<{ user: UserProfile }>('/api/v1/auth/me');
          setUserProfile(response.user || response as unknown as UserProfile);
        } catch (err) {
          console.error('Failed to fetch user profile after refresh:', err);
          setUserProfile({
            id: refreshedSession.user.id,
            email: refreshedSession.user.email || '',
            role: refreshedSession.user.user_metadata?.role || 'read_only',
          });
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Session refresh failed');
      setError(error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userProfile,
        loading,
        error,
        signIn,
        signUp,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
