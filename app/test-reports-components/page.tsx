'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import ReportsManagement from '@/app/components/reports/reports-management';

export default function TestReportsComponentsPage() {
  const [user, setUser] = useState<{ email: string; id: string; role: string; department?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Immediate check
    checkUser();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session?.user) {
          await fetchUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Handle token refresh
          await fetchUserProfile(session.user.id);
        }
      }
    );
    
    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const checkUser = async () => {
    try {
      console.log('Checking user authentication...');
      
      // Simple session check - more reliable
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session check result:', session);
      
      if (session?.user) {
        console.log('User found in session:', session.user);
        await fetchUserProfile(session.user.id);
      } else {
        console.log('No user in session');
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user ID:', userId);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, email, role, src_department')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Profile fetch error:', error);
        throw error;
      }
      
      console.log('Profile fetched successfully:', profile);
      
      setUser({
        id: profile.id,
        email: profile.email,
        role: profile.role,
        department: profile.src_department
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      setUser(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <p className="text-blue-800">
              <strong>Debug Info:</strong><br/>
              Using shared Supabase client from lib/supabaseClient<br/>
              Checking for existing session...
            </p>
          </div>
          <div className="mt-4">
            <button
              onClick={checkUser}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
            >
              Force Check Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Reports Components Test</h1>
          <p className="text-gray-600 mb-6">Please log in to test the Reports components</p>
          <div className="space-y-4">
            <button
              onClick={() => window.location.href = '/login'}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              Go to Login
            </button>
            <div className="block">
              <button
                onClick={checkUser}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm"
              >
                Retry Authentication Check
              </button>
            </div>
          </div>
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
            <p className="text-yellow-800">
              <strong>If you&apos;re already logged in:</strong><br/>
              • Try refreshing the page<br/>
              • Check if you&apos;re logged in at <a href="/dashboard" className="underline">Dashboard</a><br/>
              • Click &quot;Retry Authentication Check&quot; above
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports Components Test</h1>
          <p className="text-gray-600">
            Testing the Reports feature components with user role: <span className="font-medium capitalize">{user.role}</span>
            {user.department && ` (${user.department})`}
          </p>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Test Instructions:</strong> This page demonstrates the Reports components. 
              {user.role === 'admin' || (user.role === 'src' && user.department === 'President') 
                ? ' You can upload, view, download, and delete reports.' 
                : ' You can view and download reports based on your role permissions.'
              }
            </p>
          </div>
        </div>

        {/* Reports Management Component */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <ReportsManagement 
            userRole={user.role as 'student' | 'src' | 'admin'} 
            userDepartment={user.department}
          />
        </div>

        {/* User Info */}
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Current User Info:</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>
            {user.department && <p><strong>Department:</strong> {user.department}</p>}
            <p><strong>Can Upload Reports:</strong> {user.role === 'admin' || (user.role === 'src' && user.department === 'President') ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
