'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

// User profile interface matching our database schema
interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  student_id: string | null;
  role: 'student' | 'src' | 'admin';
  avatar_url?: string | null;
  department?: string | null;
  year_level?: number | null;
  phone?: string | null;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

// Session context interface
interface SessionContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// Create context
const SessionContext = createContext<SessionContextType | undefined>(undefined);

// Provider component
interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from database
  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId);

      if (Array.isArray(data) && data.length > 0) {
        return data[0] as UserProfile;
      }

      return null;
    } catch {
      // Optionally, you can show a user-facing error here
      return null;
    }
  };

  // Refresh profile data
  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setSession(null);
    } catch {
      // Silent error handling for sign out
    }
  };

  // Initialize session and user data
  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const profileData = await fetchProfile(session.user.id);
        setProfile(profileData);
      }

      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const profileData = await fetchProfile(session.user.id);
          setProfile(profileData);
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const value: SessionContextType = {
    user,
    profile,
    session,
    loading,
    signOut,
    refreshProfile,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

// Custom hook to use session context
export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

// Helper hooks for role-based access
export function useIsAuthenticated() {
  const { user, loading } = useSession();
  return { isAuthenticated: !!user, loading };
}

export function useUserRole() {
  const { profile, loading } = useSession();
  return { role: profile?.role, loading };
}

export function useIsAdmin() {
  const { profile } = useSession();
  return profile?.role === 'admin';
}

export function useIsSRCMember() {
  const { profile } = useSession();
  return profile?.role === 'src';
}

export function useIsStudent() {
  const { profile } = useSession();
  return profile?.role === 'student';
} 