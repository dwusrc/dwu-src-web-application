'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { clearSessionData } from '@/lib/utils';

// User profile interface matching our database schema
interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  student_id: string | null;
  role: 'student' | 'src' | 'admin';
  avatar_url?: string | null;
  department?: string | null;
  src_department?: string | null; // SRC department for SRC members
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
  signOut: (useApiRoute?: boolean) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
  updateProfile: (profileData: UserProfile) => void;
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
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Fetch user profile from database
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        return null;
      }

      return data as UserProfile;
    } catch {
      return null;
    }
  };

  // Direct profile update function
  const updateProfile = useCallback((profileData: UserProfile) => {
    setProfile(profileData);
  }, []);

  // Enhanced refresh profile data function
  const refreshProfile = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      const profileData = await fetchProfile(user.id);
      
      if (profileData) {
        setProfile(profileData);
      }
    } catch {
      // Silent error handling
    }
  }, [user]);

  // Enhanced sign out function with better error handling and cleanup
  const signOut = useCallback(async (useApiRoute: boolean = false) => {
    // Prevent multiple sign out attempts
    if (isSigningOut) {
      return { success: false, error: 'Sign out already in progress' };
    }

    setIsSigningOut(true);
    
    try {
      let signOutError = null;
      
      if (useApiRoute) {
        // Use the logout API route for server-side logout
        try {
          const response = await fetch('/api/auth/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
          
          const result = await response.json();
          if (!result.success) {
            signOutError = result.error;
          }
        } catch (apiError) {
          console.error('API logout error:', apiError);
          signOutError = 'Failed to logout via API';
        }
      } else {
        // Use direct Supabase client logout
        const { error } = await supabase.auth.signOut();
        signOutError = error;
      }
      
      if (signOutError) {
        console.error('Sign out error:', signOutError);
        // Even if there's an error, we should still clear the session
      }
      
      // Clear local state AFTER the API call succeeds
      setUser(null);
      setProfile(null);
      setSession(null);
      
      // Use utility function to clear all session data
      clearSessionData();
      
      // Return success - let the calling component handle navigation
      return { success: true };
      
    } catch (error) {
      console.error('Sign out error:', error);
      // Ensure state is cleared even if there's an error
      setUser(null);
      setProfile(null);
      setSession(null);
      clearSessionData();
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    } finally {
      setIsSigningOut(false);
    }
  }, [isSigningOut]);

  // Initialize session and user data
  useEffect(() => {
    let mounted = true;
    let authSubscription: { data: { subscription: { unsubscribe: () => void } } } | null = null;

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Initial session result:', session?.user?.id);
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          console.log('Initial user found, fetching profile...');
          const profileData = await fetchProfile(session.user.id);
          if (mounted) {
            console.log('Initial profile set:', profileData);
            setProfile(profileData);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Error getting initial session:', error);
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    try {
      authSubscription = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state change:', event, session?.user?.id);
          
          if (!mounted) return;
          
          try {
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
              console.log('Setting user in context:', session.user.id);
              const profileData = await fetchProfile(session.user.id);
              if (mounted) {
                console.log('Setting profile in context:', profileData);
                setProfile(profileData);
              }
            } else {
              console.log('Clearing user and profile from context');
              if (mounted) {
                setProfile(null);
              }
            }
          } catch (error) {
            console.error('Auth state change error:', error);
            // Set profile to null on error
            if (mounted) {
              setProfile(null);
            }
          }

          setLoading(false);
        }
      );
    } catch (error) {
      console.error('Failed to set up auth subscription:', error);
      setLoading(false);
    }

    // Cleanup function
    return () => {
      mounted = false;
      if (authSubscription?.data?.subscription) {
        authSubscription.data.subscription.unsubscribe();
      }
    };
  }, []);

  const value: SessionContextType = {
    user,
    profile,
    session,
    loading,
    signOut,
    refreshProfile,
    updateProfile,
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
  const isAuthenticated = !!user;
  console.log('useIsAuthenticated hook:', { user: user?.id, loading, isAuthenticated });
  return { isAuthenticated, loading };
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