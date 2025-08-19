'use client';

import { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import { ProtectedRoute } from '@/app/components/auth/protected-route';
import { PageLayout } from '@/app/components/layout/page-layout';

// Lazy load components
const UserManagement = lazy(() => import('@/app/components/admin/user-management'));
const AdminProjectApproval = lazy(() => import('@/app/components/src-projects/admin-project-approval'));
const ReportsManagement = lazy(() => import('@/app/components/reports/reports-management'));

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: 'student' | 'src' | 'admin';
  src_department?: string;
  created_at: string;
  is_active: boolean;
}

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalDepartments: number;
  pendingSRCProjects: number;
  totalReports: number;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'departments' | 'src-projects' | 'reports'>('overview');
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalDepartments: 0,
    pendingSRCProjects: 0,
    totalReports: 0
  });

  const tabs = [
    { id: 'overview', name: 'Dashboard Overview', icon: '📊', shortName: 'Overview' },
    { id: 'users', name: 'User Management', icon: '👥', shortName: 'Users' },
    { id: 'departments', name: 'Department Management', icon: '🏢', shortName: 'Departments' },
    { id: 'src-projects', name: 'SRC Projects Management', icon: '🚀', shortName: 'SRC Projects' },
    { id: 'reports', name: 'Reports Management', icon: '📄', shortName: 'Reports' }
  ];

  const checkUser = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        await fetchProfile(user.id);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkUser();
    fetchStats();
  }, [checkUser]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch user stats
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Fetch department stats
      const { count: totalDepartments } = await supabase
        .from('src_departments')
        .select('*', { count: 'exact', head: true });

      // Fetch pending SRC projects
      const { count: pendingSRCProjects } = await supabase
        .from('src_projects')
        .select('*', { count: 'exact', head: true })
        .eq('approval_status', 'pending');

      // Fetch total reports
      const { count: totalReports } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalDepartments: totalDepartments || 0,
        pendingSRCProjects: pendingSRCProjects || 0,
        totalReports: totalReports || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#359d49]"></div>
      </div>
    );
  }

  if (!user || profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this dashboard.</p>
        </div>
          </div>
    );
  }

  return (
    <ProtectedRoute>
      <PageLayout>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="bg-white shadow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                  <p className="text-gray-600">Welcome back, {profile.full_name}</p>
          </div>
                <div className="flex items-center space-x-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#359d49] text-white">
                    Admin
                  </span>
              </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <nav className="flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'overview' | 'users' | 'departments' | 'src-projects')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-[#359d49] text-[#359d49]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    <span className="hidden md:inline">{tab.name}</span>
                    <span className="md:hidden">{tab.shortName}</span>
                  </button>
                ))}
              </nav>
            </div>
            </div>
            
          {/* Tab Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-[#359d49] rounded-md flex items-center justify-center">
                            <span className="text-white text-lg">👥</span>
                          </div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                            <dd className="text-lg font-medium text-gray-900">{stats.totalUsers}</dd>
                          </dl>
                        </div>
                          </div>
                        </div>
            </div>
            
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-[#359d49] rounded-md flex items-center justify-center">
                            <span className="text-white text-lg">✅</span>
                          </div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Active Users</dt>
                            <dd className="text-lg font-medium text-gray-900">{stats.activeUsers}</dd>
                          </dl>
                        </div>
                      </div>
              </div>
          </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-[#359d49] rounded-md flex items-center justify-center">
                            <span className="text-white text-lg">🏢</span>
                          </div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Departments</dt>
                            <dd className="text-lg font-medium text-gray-900">{stats.totalDepartments}</dd>
                          </dl>
                </div>
                    </div>
                    </div>
                    </div>
                    
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-[#359d49] rounded-md flex items-center justify-center">
                            <span className="text-white text-lg">⏳</span>
                    </div>
                     </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Pending SRC Projects</dt>
                            <dd className="text-lg font-medium text-gray-900">{stats.pendingSRCProjects}</dd>
                          </dl>
                       </div>
                    </div>
                    </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                            <span className="text-white text-lg">📄</span>
                          </div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Total Reports</dt>
                            <dd className="text-lg font-medium text-gray-900">{stats.totalReports}</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                {/* Quick Actions */}
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => setActiveTab('users')}
                      className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-2xl mr-3">👥</span>
                      <div className="text-left">
                        <h3 className="font-medium text-gray-900">Manage Users</h3>
                        <p className="text-sm text-gray-500">Add, edit, and manage user accounts</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab('departments')}
                      className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-2xl mr-3">🏢</span>
                      <div className="text-left">
                        <h3 className="font-medium text-gray-900">Manage Departments</h3>
                        <p className="text-sm text-gray-500">Configure SRC departments and settings</p>
                    </div>
                    </button>

                    <button
                      onClick={() => setActiveTab('src-projects')}
                      className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-2xl mr-3">🚀</span>
                      <div className="text-left">
                        <h3 className="font-medium text-gray-900">SRC Projects</h3>
                        <p className="text-sm text-gray-500">Review and approve SRC projects</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab('reports')}
                      className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-2xl mr-3">📄</span>
                      <div className="text-left">
                        <h3 className="font-medium text-gray-900">Reports</h3>
                        <p className="text-sm text-gray-500">Upload and manage monthly reports</p>
                      </div>
                    </button>
                  </div>
                </div>
                        </div>
                      )}

            {activeTab === 'users' && (
              <Suspense fallback={
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#359d49]"></div>
                </div>
              }>
                <UserManagement />
              </Suspense>
            )}

            {activeTab === 'departments' && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Department Management</h2>
                <p className="text-gray-600">Department management features coming soon...</p>
                    </div>
            )}

            {activeTab === 'src-projects' && (
              <Suspense fallback={
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#359d49]"></div>
                  </div>
              }>
                <div className="space-y-6">
                  <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">SRC Projects Management</h2>
                    <p className="text-gray-600 mb-6">
                      Review, approve, and manage SRC projects submitted by department members.
                    </p>
                    <AdminProjectApproval />
              </div>
            </div>
              </Suspense>
          )}

            {activeTab === 'reports' && (
              <Suspense fallback={
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#359d49]"></div>
                  </div>
              }>
                <div className="space-y-6">
                  <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Reports Management</h2>
                    <p className="text-gray-600 mb-6">
                      Upload, manage, and track monthly reports for SRC and Student dashboards.
                    </p>
                    <ReportsManagement userRole="admin" />
                  </div>
                </div>
              </Suspense>
            )}
          </div>
        </div>
      </PageLayout>
    </ProtectedRoute>
  );
} 