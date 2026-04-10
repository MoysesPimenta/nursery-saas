'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
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
  const fetchingProfile = useRef(false);

  // Fetch user profile using a provided token directly (avoids calling getSession again)
  const fetchProfile = async (accessToken: string, userId: string, email: string) => {
    // Guard against re-entrant calls that can cause infinite loops
    if (fetchingProfile.current) return;
    fetchingProfile.current = true;

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined'
        ? window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          ? 'http://localhost:3001'
          : window.location.hostname.includes('vercel.app')
            ? `https://${window.location.hostname.replace('-frontend', '-backend')}`
            : `https://api.${window.location.hostname}`
        : 'http://localhost:3001');

      const res = await fetch(`${API_URL}/api/v1/auth/me`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUserProfile(data.user || data as unknown as UserProfile);
      } else {
        // Fallback to minimal profile
        setUserProfile({ id: userId, email, role: 'read_only' });
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      setUserProfile({ id: userId, email, role: 'read_only' });
    } finally {
      fetchingProfile.current = false;
    }
  };

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
          await fetchProfile(
            currentSession.access_token,
            currentSession.user.id,
            currentSession.user.email || ''
          );
        }

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, newSession) => {
          setSession(newSession);
          setUser(newSession?.user || null);

          if (newSession?.user) {
            // Use the token from the event directly — do NOT call getSession()
            // inside onAuthStateChange, as it can trigger another auth state
            // change and create an infinite loop
            await fetchProfile(
              newSession.access_token,
              newSession.user.id,
              newSession.user.email || ''
            );
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
        await fetchProfile(
          refreshedSession.access_token,
          refreshedSession.user.id,
          refreshedSession.user.email || ''
        );
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
