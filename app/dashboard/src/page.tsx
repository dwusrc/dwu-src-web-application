'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProtectedRoute } from '@/app/components/auth/protected-route';
import { PageLayout } from '@/app/components/layout/page-layout';
import { Button } from '@/app/components/ui/button';
import NewsManagement from '@/app/components/news/news-management';
import ComplaintList from '@/app/components/complaints/complaint-list';
import SrcProjectManagement from '@/app/components/src-projects/src-project-management';
import ReportsManagement from '@/app/components/reports/reports-management';



import { Complaint, ComplaintStatus, ComplaintPriority, SrcDepartment } from '@/types/supabase';
import { useSession } from '@/app/contexts/session-context';

// Type for complaint with related data
type ComplaintWithRelations = Complaint & {
  student?: {
    id: string;
    full_name: string;
    student_id?: string;
    department?: string;
    year_level?: number;
  };
  assigned_to?: {
    id: string;
    full_name: string;
    role: string;
  };
  // Add department information for display
  departments?: SrcDepartment[];
  // Department information for assignment dropdown
  target_departments?: SrcDepartment[];
};

interface DashboardStats {
  pendingComplaints: number;
  totalComplaints: number;
  resolvedComplaints: number;
  pendingSrcProjects: number;
  totalNewsPosts: number;
  totalReports: number;
}



// Proposal interface removed as not implemented in the application



export default function SRCDashboard() {
  const { profile } = useSession();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintWithRelations | null>(null);
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);

  const [complaints, setComplaints] = useState<ComplaintWithRelations[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [departmentMembers, setDepartmentMembers] = useState<Array<{
    id: string;
    full_name: string;
    email: string;
    role: string;
    department_id?: string;
    department_name?: string;
  }>>([]);

  // Add state for pending changes in the complaint modal
  const [pendingChanges, setPendingChanges] = useState<{
    assigned_to?: string;
    status?: ComplaintStatus;
    priority?: ComplaintPriority;
    response?: string;
  }>({});

  // Check if there are any pending changes
  const hasPendingChanges = () => {
    return Object.values(pendingChanges).some(value => value !== undefined);
  };

  // Initialize dashboard stats
  const [stats, setStats] = useState<DashboardStats>({
    pendingComplaints: 0,
    totalComplaints: 0,
    resolvedComplaints: 0,
    pendingSrcProjects: 0,
    totalNewsPosts: 0,
    totalReports: 0,
  });



  // Transform complaint data to match component expectations
  const transformComplaints = (complaints: unknown[]): ComplaintWithRelations[] => {
    return complaints.map((complaint: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
      ...complaint,
      student: complaint.student ? {
        id: complaint.student.id,
        full_name: complaint.student.full_name,
        student_id: complaint.student.student_id,
        department: complaint.student.department,
        year_level: complaint.student.year_level,
      } : undefined,
      assigned_to: complaint.assigned_to ? {
        id: complaint.assigned_to.id,
        full_name: complaint.assigned_to.full_name,
        role: complaint.assigned_to.role,
      } : undefined,
    }));
  };

  // Fetch complaints from API
  const fetchComplaints = useCallback(async (page: number = 1) => {
    try {
      const response = await fetch(`/api/complaints?limit=10&offset=${(page - 1) * 10}`);
      if (response.ok) {
        const data = await response.json();
        const transformedComplaints = transformComplaints(data.complaints || []);
        setComplaints(transformedComplaints);
        setTotalCount(data.pagination?.total || 0);
      } else {
        alert('Failed to load complaints');
      }
    } catch {
      alert('Failed to load complaints');
    }
  }, []);



  // Handle complaint actions
  const fetchDepartmentMembers = async (departmentIds: string[]) => {
    try {
      console.log('Fetching members for departments:', departmentIds);
      
      // Fetch members from all target departments
      const allMembers: Array<{
        id: string;
        full_name: string;
        email: string;
        role: string;
        department_id?: string;
        department_name?: string;
      }> = [];
      
      for (const deptId of departmentIds) {
        const response = await fetch(`/api/departments/${deptId}/members`);
      if (response.ok) {
        const data = await response.json();
          console.log(`Members from department ${deptId}:`, data.members);
          if (data.members && data.members.length > 0) {
            // Add department info to each member to avoid duplicates
            const membersWithDept = data.members.map((member: {
              id: string;
              full_name: string;
              email: string;
              role: string;
            }) => ({
              ...member,
              department_id: deptId,
              department_name: data.department_name
            }));
            allMembers.push(...membersWithDept);
          }
      } else {
          console.error(`Failed to fetch members for department ${deptId}:`, response.status);
        }
      }
      
      // Remove duplicate members (in case someone is in multiple departments)
      const uniqueMembers = allMembers.filter((member, index, self) => 
        index === self.findIndex(m => m.id === member.id)
      );
      
      console.log('Total unique members found:', uniqueMembers.length);
      setDepartmentMembers(uniqueMembers);
      
    } catch (error) {
      console.error('Failed to fetch department members:', error);
      setDepartmentMembers([]);
    }
  };

  const handleViewComplaint = (complaint: ComplaintWithRelations) => {
    setSelectedComplaint(complaint);
    setShowComplaintModal(true);
    
    // Reset pending changes when opening a new complaint
    setPendingChanges({});
    
    // Fetch department members from ALL target departments of the complaint
    if (complaint.departments_selected && complaint.departments_selected.length > 0) {
      console.log('Complaint target departments:', complaint.departments_selected);
      // Fetch members from ALL target departments
      fetchDepartmentMembers(complaint.departments_selected);
    } else {
      console.log('No target departments found for complaint');
      // If no target departments, clear the members list
      setDepartmentMembers([]);
    }
  };

  const handleUpdateComplaint = async () => {
    if (!selectedComplaint) return;
    
    try {
      let hasChanges = false;
      
      // Apply all pending changes
      if (pendingChanges.assigned_to !== undefined) {
        hasChanges = true;
        if (pendingChanges.assigned_to) {
          // Assign complaint
          const response = await fetch(`/api/complaints/${selectedComplaint.id}/assign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assigned_to: pendingChanges.assigned_to }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to assign complaint');
          }
        } else {
          // Unassign complaint
          const response = await fetch(`/api/complaints/${selectedComplaint.id}/assign`, {
            method: 'DELETE',
          });
          
          if (!response.ok) {
            throw new Error('Failed to unassign complaint');
          }
        }
      }
      
      if (pendingChanges.status !== undefined) {
        hasChanges = true;
        const response = await fetch(`/api/complaints/${selectedComplaint.id}/status`, {
        method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: pendingChanges.status }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update status');
        }
      }
      
      if (pendingChanges.priority !== undefined) {
        hasChanges = true;
        const response = await fetch(`/api/complaints/${selectedComplaint.id}/priority`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priority: pendingChanges.priority }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update priority');
        }
      }
      
      if (pendingChanges.response !== undefined) {
        hasChanges = true;
        const response = await fetch(`/api/complaints/${selectedComplaint.id}/response`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ response: pendingChanges.response }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update response');
        }
      }
      
      if (hasChanges) {
        // Refresh the complaint data
        await fetchComplaints();
        alert('Complaint updated successfully!');
        setShowComplaintModal(false);
        setPendingChanges({});
      } else {
        alert('No changes to save');
      }
      
    } catch (error) {
      console.error('Update failed:', error);
      alert(`Failed to update complaint: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteComplaint = async (complaint: ComplaintWithRelations) => {
    if (!confirm(`Are you sure you want to delete the complaint "${complaint.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/complaints/${complaint.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete complaint');
      }

      // Refresh complaints and stats
      await fetchComplaints();
      await fetchDashboardStats();
      
      alert('Complaint deleted successfully!');
    } catch (error) {
      console.error('Error deleting complaint:', error);
      alert(`Failed to delete complaint: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

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
          totalComplaints,
          pendingComplaints,
          resolvedComplaints,
        }));
      }

      // Fetch SRC projects count
      const projectsResponse = await fetch('/api/src-projects/src');
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        const pendingSrcProjects = projectsData.projects?.filter((p: { approval_status: string }) => p.approval_status === 'pending').length || 0;
        
        setStats(prev => ({
          ...prev,
          pendingSrcProjects,
        }));
      }

      // Fetch news count
      const newsResponse = await fetch('/api/news/posts?limit=1000');
      if (newsResponse.ok) {
        const newsData = await newsResponse.json();
        const totalNewsPosts = newsData.posts?.length || 0;
        
        setStats(prev => ({
          ...prev,
          totalNewsPosts,
        }));
      }

      // Fetch reports count
      const reportsResponse = await fetch('/api/reports?limit=1000');
      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json();
        const totalReports = reportsData.reports?.length || 0;
        
        setStats(prev => ({
          ...prev,
          totalReports,
        }));
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  }, []);

  // Load complaints and stats on component mount
  useEffect(() => {
    fetchComplaints();
    fetchDashboardStats();
  }, [fetchComplaints, fetchDashboardStats]);

  // Remove mock proposals data - not implemented in the application





  // getStatusColor function removed as no longer used

  return (
    <ProtectedRoute requiredRole="src">
      <PageLayout>
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#2a6b39]">SRC Dashboard</h1>
                <p className="text-gray-600 mt-2">Manage complaints, SRC projects, news, and reports</p>
                {profile?.src_department && (
                  <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                    {profile.src_department} Department
                  </div>
                )}
              </div>
              <div className="mt-4 sm:mt-0">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Welcome back,</p>
                  <p className="text-lg font-semibold text-gray-900">{profile?.full_name || 'SRC Member'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mb-6">
            <nav className="flex overflow-x-auto scrollbar-hide border-b border-gray-200 bg-white rounded-t-lg">
              <div className="flex space-x-1 min-w-max px-2 sm:px-4">
                {[
                  { id: 'overview', name: 'Overview', icon: '📊', shortName: 'Overview' },
                  { id: 'complaints', name: 'Complaints', icon: '⚠️', shortName: 'Complaints' },
                  { id: 'src-projects', name: 'SRC Projects', icon: '🚀', shortName: 'Projects' },
                  { id: 'reports', name: 'Reports', icon: '📄', shortName: 'Reports' },
                  { id: 'news', name: 'News & Announcements', icon: '📢', shortName: 'News' },
                ].map((tab: { id: string; name: string; icon: string; shortName: string; href?: string }) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if ('href' in tab && tab.href) {
                        // Navigate to external page
                        window.location.href = tab.href;
                      } else {
                        // Set active tab for internal content
                        setActiveTab(tab.id);
                      }
                    }}
                    className={`py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-200 rounded-t-lg ${
                      activeTab === tab.id
                        ? 'border-[#359d49] text-[#359d49] bg-[#359d49]/5'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    <span className="hidden sm:inline">{tab.name}</span>
                    <span className="sm:hidden">{tab.shortName}</span>
                  </button>
                ))}
              </div>
            </nav>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
                  <div className="flex items-center">
                    <div className="p-3 bg-red-100 rounded-xl">
                      <span className="text-2xl">⚠️</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Pending Complaints</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.pendingComplaints}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <span className="text-2xl">📊</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Complaints</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalComplaints}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
                  <div className="flex items-center">
                    <div className="p-3 bg-green-100 rounded-xl">
                      <span className="text-2xl">✅</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Resolved</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.resolvedComplaints}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
                  <div className="flex items-center">
                    <div className="p-3 bg-yellow-100 rounded-xl">
                      <span className="text-2xl">⏳</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Pending Projects</p>
                      <p className="text-2xl font-bold text-yellow-600">{stats.pendingSrcProjects}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
                  <div className="flex items-center">
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <span className="text-2xl">📢</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">News Posts</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalNewsPosts}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
                  <div className="flex items-center">
                    <div className="p-3 bg-indigo-100 rounded-xl">
                      <span className="text-2xl">📄</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Reports</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalReports}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <Button
                    onClick={() => setShowNewsModal(true)}
                    className="bg-gradient-to-r from-[#359d49] to-[#2a6b39] hover:from-[#2a6b39] hover:to-[#1a4a2a] text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    📢 Create News
                  </Button>
                  <Button
                    onClick={() => setActiveTab('complaints')}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    ⚠️ View Complaints
                  </Button>
                  <Button
                    onClick={() => setActiveTab('src-projects')}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    🚀 SRC Projects
                  </Button>
                  <Button
                    onClick={() => setActiveTab('reports')}
                    className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    📊 Reports
                  </Button>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {stats.pendingComplaints > 0 && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="w-2 h-2 bg-red-400 rounded-full mr-3"></span>
                      {stats.pendingComplaints} pending complaint{stats.pendingComplaints !== 1 ? 's' : ''} require{stats.pendingComplaints !== 1 ? '' : 's'} attention
                    </div>
                  )}
                  {stats.pendingSrcProjects > 0 && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></span>
                      {stats.pendingSrcProjects} SRC project{stats.pendingSrcProjects !== 1 ? 's' : ''} pending approval
                    </div>
                  )}
                  {stats.totalNewsPosts > 0 && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                      {stats.totalNewsPosts} news post{stats.totalNewsPosts !== 1 ? 's' : ''} published
                    </div>
                  )}
                  {stats.totalReports > 0 && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                      {stats.totalReports} report{stats.totalReports !== 1 ? 's' : ''} available for download
                    </div>
                  )}
                  {stats.pendingComplaints === 0 && stats.pendingSrcProjects === 0 && (
                    <div className="text-sm text-gray-500 italic">
                      All caught up! No pending items require attention.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Complaints Tab */}
          {activeTab === 'complaints' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Complaint Management</h2>
              </div>

              <ComplaintList
                complaints={complaints}
                onView={(complaint) => handleViewComplaint(complaint as ComplaintWithRelations)}
                onDelete={handleDeleteComplaint}
                currentPage={currentPage}
                totalCount={totalCount}
                onPageChange={setCurrentPage}
                sortBy="created_at"
                sortOrder="desc"
              />
            </div>
          )}



          {/* Proposals Tab - Removed as not implemented in the application */}

          {/* SRC Projects Tab */}
          {activeTab === 'src-projects' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">SRC Project Management</h2>
                <p className="text-sm text-gray-600">Manage projects for your department</p>
              </div>
              <SrcProjectManagement userDepartment={profile?.src_department || 'General'} />
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
                <p className="text-sm text-gray-600">View and download monthly reports</p>
              </div>
              

              
              <ReportsManagement 
                userRole="src" 
                userDepartment={profile?.src_department || undefined} 
              />
            </div>
          )}



          {/* News Tab */}
          {activeTab === 'news' && (
            <NewsManagement />
          )}

          {/* Communication Tab - Removed as not implemented in the application */}
          {/* Student Services Tab - Removed as not implemented in the application */}

          {/* Modals */}
          {/* News Creation Modal */}
          {showNewsModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Create News Post</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
                      placeholder="Enter news title..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                    <textarea
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
                      placeholder="Enter news content..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]">
                      <option value="general">General</option>
                      <option value="academic">Academic</option>
                      <option value="events">Events</option>
                      <option value="announcements">Announcements</option>
                    </select>
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      onClick={() => setShowNewsModal(false)}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-700"
                    >
                      Cancel
                    </Button>
                    <Button className="bg-[#359d49] hover:bg-[#2a6b39] text-white">
                      Create Post
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Complaint Detail Modal */}
          {showComplaintModal && selectedComplaint && (
            <div id="complaint-modal" className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Complaint Details</h3>
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
                  {hasPendingChanges() && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-700">
                        ⚠️ You have pending changes. Click &quot;Update Complaint&quot; to save them.
                      </p>
                </div>
                  )}
                </div>
                <form className="p-6 space-y-6">
                  {/* Student Complaint Details - Prominently Displayed */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <div className="p-2 bg-blue-100 rounded-lg mr-3">
                        <span className="text-xl">📝</span>
                      </div>
                      <h3 className="text-lg font-semibold text-blue-900">Student Complaint Details</h3>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Title */}
                  <div>
                        <label className="block text-sm font-medium text-blue-700 mb-2">Complaint Title</label>
                        <div className="bg-white border border-blue-200 rounded-md p-3">
                          <h4 className="font-medium text-gray-900 text-lg">{selectedComplaint.title}</h4>
                  </div>
                      </div>
                      
                      {/* Student Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                          <label className="block text-sm font-medium text-blue-700 mb-2">Submitted By</label>
                          <div className="bg-white border border-blue-200 rounded-md p-3">
                            <p className="text-gray-900 font-medium">{selectedComplaint.student?.full_name || 'Unknown Student'}</p>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-blue-700 mb-2">Department</label>
                          <div className="bg-white border border-blue-200 rounded-md p-3">
                            <p className="text-gray-900">{selectedComplaint.student?.department || 'Not specified'}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium text-blue-700 mb-2">Complaint Description</label>
                        <div className="bg-white border border-blue-200 rounded-md p-3">
                          <p className="text-gray-900 leading-relaxed">{selectedComplaint.description}</p>
                        </div>
                      </div>
                      
                      {/* Target Departments */}
                      <div>
                        <label className="block text-sm font-medium text-blue-700 mb-2">Target Departments</label>
                        <div className="bg-white border border-blue-200 rounded-md p-3">
                          <div className="flex flex-wrap gap-2">
                            {selectedComplaint.departments_selected && selectedComplaint.departments_selected.length > 0 ? (
                              selectedComplaint.departments_selected.map((deptId) => {
                                const dept = departmentMembers.find(m => m.department_id === deptId);
                                return (
                                  <span key={deptId} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {dept?.department_name || deptId}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-gray-500">No target departments specified</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Management Actions */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <div className="p-2 bg-gray-100 rounded-lg mr-3">
                        <span className="text-xl">⚙️</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Management Actions</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      {/* Assignment */}
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Assign To {selectedComplaint.departments_selected && selectedComplaint.departments_selected.length > 0 && (
                            <span className="text-gray-500 text-xs">
                              ({selectedComplaint.departments_selected.length > 1 ? 'from all target departments' : 'from target department'})
                            </span>
                          )}
                        </label>
                      <select 
                          value={pendingChanges.assigned_to !== undefined ? pendingChanges.assigned_to : (selectedComplaint.assigned_to?.id || '')}
                          onChange={(e) => setPendingChanges(prev => ({ ...prev, assigned_to: e.target.value || undefined }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49] focus:border-[#359d49]"
                        >
                          <option value="">Unassigned</option>
                          {departmentMembers.length > 0 ? (
                            <optgroup label={`All Department Members (${departmentMembers.length} available)`}>
                              {departmentMembers.map((member) => (
                                <option key={member.id} value={member.id}>
                                  {member.full_name} {member.department_name && `(${member.department_name})`}
                                </option>
                              ))}
                            </optgroup>
                          ) : (
                            <option value="" disabled>No department members available</option>
                          )}
                      </select>
                        {pendingChanges.assigned_to !== undefined ? (
                          <p className="text-sm text-blue-600 mt-2">
                            ⚠️ Pending: Will be assigned to {departmentMembers.find(m => m.id === pendingChanges.assigned_to)?.full_name || 'selected member'}
                          </p>
                        ) : selectedComplaint.assigned_to ? (
                          <p className="text-sm text-gray-600 mt-2">
                            Currently assigned to: <span className="font-medium">{selectedComplaint.assigned_to.full_name}</span>
                          </p>
                        ) : null}
                        {departmentMembers.length === 0 && (
                          <p className="text-sm text-gray-500 mt-2">
                            {selectedComplaint.departments_selected && selectedComplaint.departments_selected.length > 0 
                              ? 'Loading department members...' 
                              : 'No target departments found for this complaint'
                            }
                          </p>
                        )}
                    </div>

                      {/* Status Update */}
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select 
                          value={pendingChanges.status !== undefined ? pendingChanges.status : selectedComplaint.status}
                          onChange={(e) => setPendingChanges(prev => ({ ...prev, status: e.target.value as ComplaintStatus }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49] focus:border-[#359d49]"
                        >
                          <option value="pending">⏳ Pending</option>
                          <option value="in_progress">🔄 In Progress</option>
                          <option value="resolved">✅ Resolved</option>
                          <option value="closed">🔒 Closed</option>
                          <option value="rejected">❌ Rejected</option>
                      </select>
                        {pendingChanges.status !== undefined && pendingChanges.status !== selectedComplaint.status && (
                          <p className="text-sm text-blue-600 mt-2">
                            ⚠️ Pending: Will change from {selectedComplaint.status} to {pendingChanges.status}
                          </p>
                        )}
                    </div>

                      {/* Priority Update */}
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                        <select 
                          value={pendingChanges.priority !== undefined ? pendingChanges.priority : selectedComplaint.priority}
                          onChange={(e) => setPendingChanges(prev => ({ ...prev, priority: e.target.value as ComplaintPriority }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49] focus:border-[#359d49]"
                        >
                          <option value="low">🟢 Low</option>
                          <option value="medium">🟡 Medium</option>
                          <option value="high">🟠 High</option>
                          <option value="urgent">🔴 Urgent</option>
                        </select>
                        {pendingChanges.priority !== undefined && pendingChanges.priority !== selectedComplaint.priority && (
                          <p className="text-sm text-blue-600 mt-2">
                            ⚠️ Pending: Will change from {selectedComplaint.priority} to {pendingChanges.priority}
                          </p>
                        )}
                  </div>
                    </div>

                    {/* SRC Response Section - Now part of Management Actions */}
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center mb-4">
                        <div className="p-2 bg-green-100 rounded-lg mr-3">
                          <span className="text-xl">💬</span>
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900">SRC Response</h4>
                      </div>
                      
                      <div className="space-y-4">
                        {/* Current Response Display */}
                        {selectedComplaint.response && (
                  <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Current Response</label>
                            <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                              <p className="text-gray-900 leading-relaxed">{selectedComplaint.response}</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Response Input */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {selectedComplaint.response ? 'Update Response' : 'Add SRC Response'}
                          </label>
                    <textarea
                      name="response"
                      rows={4}
                            value={pendingChanges.response !== undefined ? pendingChanges.response : (selectedComplaint.response || '')}
                            onChange={(e) => setPendingChanges(prev => ({ ...prev, response: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49] focus:border-[#359d49]"
                            placeholder="✍️ Write your response here..."
                          />
                          {pendingChanges.response !== undefined && pendingChanges.response !== selectedComplaint.response && (
                            <p className="text-sm text-blue-600 mt-2">
                              ⚠️ Pending: Response will be updated
                            </p>
                          )}
                  </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <Button
                      type="button"
                      onClick={() => setShowComplaintModal(false)}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2"
                    >
                      Close
                    </Button>
                    {hasPendingChanges() && (
                      <Button
                        type="button"
                        onClick={() => setPendingChanges({})}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2"
                      >
                        Reset Changes
                      </Button>
                    )}
                    <Button 
                      type="button"
                      onClick={handleUpdateComplaint}
                      className="bg-[#359d49] hover:bg-[#2a6b39] text-white px-6 py-2"
                      disabled={!hasPendingChanges()}
                    >
                      Update Complaint
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Proposal Review Modal - Removed as not implemented in the application */}
        </div>
      </PageLayout>
    </ProtectedRoute>
  );
} 