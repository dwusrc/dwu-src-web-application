'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, useIsAuthenticated } from '@/app/contexts/session-context';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'student' | 'src_member' | 'admin';
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
  fallback,
  redirectTo = '/login'
}: ProtectedRouteProps) {
  const { profile, loading } = useSession();
  const { isAuthenticated } = useIsAuthenticated();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // If not authenticated, redirect to login
      if (!isAuthenticated) {
        router.push(redirectTo);
        return;
      }

      // If role is required, check if user has the required role
      if (requiredRole && profile?.role !== requiredRole) {
        // Redirect to /dashboard for all roles (quick fix)
        router.push('/dashboard');
        return;
      }
    }
  }, [isAuthenticated, profile?.role, requiredRole, loading, router, redirectTo]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#359d49] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show fallback if provided and user is not authenticated
  if (!isAuthenticated && fallback) {
    return <>{fallback}</>;
  }

  // Show children if authenticated and has required role
  if (isAuthenticated && (!requiredRole || profile?.role === requiredRole || 
      (profile?.role === 'admin' && requiredRole !== 'admin'))) {
    return <>{children}</>;
  }

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#359d49] mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}

// Convenience components for specific roles
export function StudentRoute({ children, fallback, redirectTo }: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return (
    <ProtectedRoute requiredRole="student" fallback={fallback} redirectTo={redirectTo}>
      {children}
    </ProtectedRoute>
  );
}

export function SRCMemberRoute({ children, fallback, redirectTo }: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return (
    <ProtectedRoute requiredRole="src_member" fallback={fallback} redirectTo={redirectTo}>
      {children}
    </ProtectedRoute>
  );
}

export function AdminRoute({ children, fallback, redirectTo }: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return (
    <ProtectedRoute requiredRole="admin" fallback={fallback} redirectTo={redirectTo}>
      {children}
    </ProtectedRoute>
  );
}

// Component for authenticated users only (any role)
export function AuthenticatedRoute({ children, fallback, redirectTo }: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return (
    <ProtectedRoute fallback={fallback} redirectTo={redirectTo}>
      {children}
    </ProtectedRoute>
  );
} 