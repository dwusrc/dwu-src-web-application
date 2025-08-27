'use client';

import { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { ProtectedRoute } from '@/app/components/auth/protected-route';
import { PageLayout } from '@/app/components/layout/page-layout';
import { Button } from '@/app/components/ui/button';
import { ComplaintCategory, ComplaintPriority, ComplaintWithRelations } from '@/types/supabase';
import { useSession } from '@/app/contexts/session-context';

// Lazy load heavy components
const NewsDisplay = lazy(() => import('@/app/components/news/news-display'));
const FeaturedNews = lazy(() => import('@/app/components/news/featured-news'));
const ComplaintForm = lazy(() => import('@/app/components/forms/complaint-form'));
const ComplaintList = lazy(() => import('@/app/components/complaints/complaint-list'));
const ComplaintView = lazy(() => import('@/app/components/forms/complaint-view'));
const SrcProjectList = lazy(() => import('@/app/components/src-projects/src-project-list'));
const ReportsManagement = lazy(() => import('@/app/components/reports/reports-management'));

// Loading component for lazy-loaded components
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#359d49]"></div>
  </div>
);

interface DashboardStats {
  myComplaints: number;
  pendingComplaints: number;
  resolvedComplaints: number;
  availableReports: number;
  srcProjects: number;
}

export default function StudentDashboard() {
  const { session, profile } = useSession();
  const [activeTab, setActiveTab] = useState('overview');
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintWithRelations | null>(null);
  const [complaints, setComplaints] = useState<ComplaintWithRelations[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    myComplaints: 0,
    pendingComplaints: 0,
    resolvedComplaints: 0,
    availableReports: 0,
    srcProjects: 0,
  });

  // Transform complaint data to match component expectations
  const transformComplaints = (complaints: unknown[]): ComplaintWithRelations[] => {
    return complaints.map((complaint: unknown) => {
      const c = complaint as ComplaintWithRelations;
      return c;
    });
  };

  const fetchComplaints = useCallback(async (page: number = 1) => {
    try {
      const response = await fetch(`/api/complaints?limit=10&offset=${(page - 1) * 10}`);
      if (!response.ok) {
        throw new Error('Failed to fetch complaints');
      }
      const data = await response.json();
      setComplaints(transformComplaints(data.complaints));
      setTotalCount(data.pagination.total);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    }
  }, []);

  // Fetch dashboard statistics
  const fetchDashboardStats = useCallback(async () => {
    try {
      // Fetch complaints count
      const complaintsResponse = await fetch('/api/complaints?limit=1000');
      if (complaintsResponse.ok) {
        const complaintsData = await complaintsResponse.json();
        const totalComplaints = complaintsData.complaints?.length || 0;
        const pendingComplaints = complaintsData.complaints?.filter((c: { status: string }) => c.status === 'pending').length || 0;
        const resolvedComplaints = complaintsData.complaints?.filter((c: { status: string }) => c.status === 'resolved' || c.status === 'closed').length || 0;
        
        setStats(prev => ({
          ...prev,
          myComplaints: totalComplaints,
          pendingComplaints,
          resolvedComplaints,
        }));
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  }, []);

  const handleSubmitComplaint = async (formData: {
    title: string;
    description: string;
    category: ComplaintCategory;
    priority: ComplaintPriority;
  }) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit complaint');
      }

      setShowComplaintModal(false);
      fetchComplaints(currentPage);
      fetchDashboardStats(); // Refresh stats
    } catch (error) {
      console.error('Error submitting complaint:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewComplaint = (complaint: ComplaintWithRelations) => {
    setSelectedComplaint(complaint);
    setEditMode(false);
  };

  const handleEditComplaint = (complaint: ComplaintWithRelations) => {
    setSelectedComplaint(complaint);
    setEditMode(true);
  };

  const handleSaveEdit = async (formData: {
    title: string;
    description: string;
    category: ComplaintCategory;
    priority: ComplaintPriority;
  }) => {
    if (!selectedComplaint) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/complaints/${selectedComplaint.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update complaint');
      }

      setEditMode(false);
      setSelectedComplaint(null);
      fetchComplaints(currentPage);
      fetchDashboardStats(); // Refresh stats
    } catch (error) {
      console.error('Error updating complaint:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setSelectedComplaint(null);
  };

  const handleDeleteComplaint = async (complaint: ComplaintWithRelations) => {
    if (!confirm('Are you sure you want to delete this complaint?')) return;

    try {
      const response = await fetch(`/api/complaints/${complaint.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete complaint');
      }

      setSelectedComplaint(null);
      fetchComplaints(currentPage);
      fetchDashboardStats(); // Refresh stats
    } catch (error) {
      console.error('Error deleting complaint:', error);
    }
  };

  // Only fetch complaints when the complaints tab is active
  useEffect(() => {
    if (activeTab === 'complaints') {
      fetchComplaints();
    }
  }, [activeTab, fetchComplaints]);

  // Fetch dashboard stats on component mount
  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  // Initialize mobile navigation arrows
  useEffect(() => {
    const updateArrows = () => {
      const container = document.getElementById('mobile-tabs-container');
      const leftArrow = document.getElementById('left-arrow');
      const rightArrow = document.getElementById('right-arrow');
      
      if (container && leftArrow && rightArrow) {
        // Check if scrolling is needed
        const hasOverflow = container.scrollWidth > container.clientWidth;
        
        if (hasOverflow) {
          // Show right arrow initially if there's overflow
          rightArrow.style.display = 'block';
          leftArrow.style.display = 'none';
        } else {
          // Hide both arrows if no overflow
          leftArrow.style.display = 'none';
          rightArrow.style.display = 'none';
        }
      }
    };

    // Initial check
    updateArrows();

    // Add resize listener
    window.addEventListener('resize', updateArrows);

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateArrows);
    };
  }, []);

  const tabs = [
    { id: 'overview', name: 'Overview', shortName: 'Overview', icon: '📊' },
    { id: 'news', name: 'News & Updates', shortName: 'News', icon: '📢' },
    { id: 'complaints', name: 'My Complaints', shortName: 'Complaints', icon: '⚠️' },
    { id: 'src-projects', name: 'SRC Projects', shortName: 'Projects', icon: '🚀' },
    { id: 'reports', name: 'Reports', shortName: 'Reports', icon: '📄' },
    { id: 'profile', name: 'Profile', shortName: 'Profile', icon: '👤' },
  ];

  return (
    <ProtectedRoute requiredRole="student">
      <PageLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Welcome back, {profile?.full_name || session?.user?.user_metadata?.full_name || 'Student'}!
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="mb-8">
            {/* Desktop Navigation */}
            <nav className="hidden md:block">
              <div className="flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-[#359d49] text-[#359d49]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    <span>{tab.name}</span>
                  </button>
                ))}
              </div>
            </nav>

            {/* Mobile Navigation - Horizontal Scrollable */}
            <nav className="md:hidden">
              <div className="relative">
                {/* Left Arrow */}
                <button
                  onClick={() => {
                    const container = document.getElementById('mobile-tabs-container');
                    if (container) {
                      container.scrollBy({ left: -200, behavior: 'smooth' });
                    }
                  }}
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full p-2 shadow-lg hover:bg-white transition-all duration-200"
                  style={{ display: 'none' }}
                  id="left-arrow"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Right Arrow */}
                <button
                  onClick={() => {
                    const container = document.getElementById('mobile-tabs-container');
                    if (container) {
                      container.scrollBy({ left: 200, behavior: 'smooth' });
                    }
                  }}
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full p-2 shadow-lg hover:bg-white transition-all duration-200"
                  style={{ display: 'none' }}
                  id="right-arrow"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <div 
                  id="mobile-tabs-container"
                  className="flex space-x-2 overflow-x-auto pb-2 -mx-4 px-4 scroll-smooth" 
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  onScroll={(e) => {
                    const container = e.currentTarget;
                    const leftArrow = document.getElementById('left-arrow');
                    const rightArrow = document.getElementById('right-arrow');
                    
                    if (leftArrow && rightArrow) {
                      // Show/hide left arrow
                      if (container.scrollLeft > 0) {
                        leftArrow.style.display = 'block';
                      } else {
                        leftArrow.style.display = 'none';
                      }
                      
                      // Show/hide right arrow
                      if (container.scrollLeft < container.scrollWidth - container.clientWidth - 1) {
                        rightArrow.style.display = 'block';
                      } else {
                        rightArrow.style.display = 'none';
                      }
                    }
                  }}
                >
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-[#359d49] text-[#359d49] bg-[#359d49]/5'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="mr-1">{tab.icon}</span>
                    <span>{tab.shortName}</span>
                  </button>
                ))}
                </div>
              </div>
              <style jsx>{`
                .overflow-x-auto::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
            </nav>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center">
                    <div className="p-3 bg-red-50 rounded-xl">
                      <span className="text-2xl">⚠️</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Complaints</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.myComplaints}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center">
                    <div className="p-3 bg-yellow-50 rounded-xl">
                      <span className="text-2xl">⏳</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Pending</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.pendingComplaints}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center">
                    <div className="p-3 bg-green-50 rounded-xl">
                      <span className="text-2xl">✅</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Resolved</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.resolvedComplaints}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={() => setShowComplaintModal(true)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                  >
                    <span className="mr-2">📝</span>
                    Submit New Complaint
                  </Button>
                  <Button
                    onClick={() => setActiveTab('news')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                  >
                    <span className="mr-2">📢</span>
                    View Latest News
                  </Button>
                </div>
              </div>

              {/* Recent Complaints */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Recent Complaints</h2>
                  <Button
                    onClick={() => setActiveTab('complaints')}
                    variant="outline"
                    className="text-[#359d49] border-[#359d49] hover:bg-[#359d49] hover:text-white"
                  >
                    View All
                  </Button>
                </div>
                <div className="space-y-3">
                  {complaints.slice(0, 3).map((complaint) => (
                    <div key={complaint.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 truncate">{complaint.title}</h3>
                        <p className="text-sm text-gray-600 capitalize">Status: {complaint.status.replace('_', ' ')}</p>
                      </div>
                      <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                        complaint.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        complaint.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        complaint.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        complaint.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {complaint.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                  {complaints.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <span className="text-4xl mb-2 block">📝</span>
                      <p>No complaints yet</p>
                      <p className="text-sm">Submit your first complaint to get started</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Links */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <div className="text-center">
                    <span className="text-3xl mb-3 block">🚀</span>
                    <h3 className="font-semibold text-blue-900 mb-2">SRC Projects</h3>
                    <p className="text-blue-700 text-sm mb-4">View approved student initiatives and projects</p>
                    <Button
                      onClick={() => setActiveTab('src-projects')}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Explore Projects
                    </Button>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                  <div className="text-center">
                    <span className="text-3xl mb-3 block">📄</span>
                    <h3 className="font-semibold text-green-900 mb-2">Reports</h3>
                    <p className="text-green-700 text-sm mb-4">Access monthly reports and documents</p>
                    <Button
                      onClick={() => setActiveTab('reports')}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      View Reports
                    </Button>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                  <div className="text-center">
                    <span className="text-3xl mb-3 block">👤</span>
                    <h3 className="font-semibold text-purple-900 mb-2">Profile</h3>
                    <p className="text-purple-700 text-sm mb-4">Manage your account and preferences</p>
                    <Button
                      onClick={() => setActiveTab('profile')}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      Edit Profile
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* News Tab */}
          {activeTab === 'news' && (
            <Suspense fallback={<LoadingSpinner />}>
              <div className="space-y-6">
                <FeaturedNews />
                <NewsDisplay />
              </div>
            </Suspense>
          )}

          {/* Complaints Tab */}
          {activeTab === 'complaints' && (
            <Suspense fallback={<LoadingSpinner />}>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">My Complaints</h2>
                  <Button
                    onClick={() => setShowComplaintModal(true)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Submit New Complaint
                  </Button>
                </div>
                <ComplaintList
                  complaints={complaints}
                  onView={handleViewComplaint}
                  currentPage={currentPage}
                  totalCount={totalCount}
                  onPageChange={setCurrentPage}
                  sortBy="created_at"
                  sortOrder="desc"
                />
              </div>
            </Suspense>
          )}

          {/* SRC Projects Tab */}
          {activeTab === 'src-projects' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">SRC Projects</h2>
                <p className="text-sm text-gray-600">View approved SRC initiatives and projects</p>
              </div>
              <Suspense fallback={<LoadingSpinner />}>
                <SrcProjectList
                  showCreateButton={false}
                  onCreateNew={() => {}}
                />
              </Suspense>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
                <p className="text-sm text-gray-600">View and download monthly reports</p>
              </div>
              <Suspense fallback={<LoadingSpinner />}>
                <ReportsManagement userRole="student" />
              </Suspense>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {profile?.full_name || session?.user?.user_metadata?.full_name || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{session?.user?.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Student ID</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {profile?.student_id || session?.user?.user_metadata?.student_id || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Department</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {profile?.department || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Year Level</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {profile?.year_level ? `Year ${profile.year_level}` : 'Not set'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Complaint Modal */}
        {showComplaintModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Submit New Complaint</h3>
                  <button
                    onClick={() => setShowComplaintModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <Suspense fallback={<LoadingSpinner />}>
                  <ComplaintForm
                    onSubmit={handleSubmitComplaint}
                    onCancel={() => setShowComplaintModal(false)}
                    isSubmitting={isSubmitting}
                  />
                </Suspense>
              </div>
            </div>
          </div>
        )}

        {/* Complaint View Modal */}
        {selectedComplaint && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Complaint Details</h3>
                  <button
                    onClick={() => setSelectedComplaint(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <Suspense fallback={<LoadingSpinner />}>
                  {editMode ? (
                    <ComplaintForm
                      initialData={{
                        title: selectedComplaint.title,
                        description: selectedComplaint.description,
                        category: selectedComplaint.category,
                        priority: selectedComplaint.priority,
                      }}
                      onSubmit={handleSaveEdit}
                      onCancel={handleCancelEdit}
                      isSubmitting={isSubmitting}
                      submitLabel="Update Complaint"
                    />
                  ) : (
                    <ComplaintView
                      complaint={selectedComplaint}
                      showActions={true}
                      onEdit={() => handleEditComplaint(selectedComplaint)}
                      onDelete={() => handleDeleteComplaint(selectedComplaint)}
                      userRole="student"
                      isAssignedToUser={false}
                    />
                  )}
                </Suspense>
              </div>
            </div>
          </div>
        )}
      </PageLayout>
    </ProtectedRoute>
  );
} 