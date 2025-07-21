'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/app/contexts/session-context';

export default function DashboardRedirectPage() {
  const { profile, loading } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Don't do anything while loading
    if (loading) {
      return;
    }

    // If loaded and we have a profile, redirect to the role-specific page
    if (profile) {
      let redirectUrl = '/dashboard'; // Fallback
      if (profile.role === 'student') redirectUrl = '/dashboard/student';
      else if (profile.role === 'src') redirectUrl = '/dashboard/src';
      else if (profile.role === 'admin') redirectUrl = '/dashboard/admin';
      
      router.replace(redirectUrl);
    } else {
      // If loaded and no profile, redirect to login
      router.replace('/login');
    }
  }, [profile, loading, router]);

  // Render a loading state while the redirect is happening
  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-[#359d49]"></div>
        <h2 className="mt-4 text-xl font-semibold text-gray-700">Loading your dashboard...</h2>
        <p className="text-gray-500">Please wait a moment.</p>
      </div>
    </div>
  );
} 