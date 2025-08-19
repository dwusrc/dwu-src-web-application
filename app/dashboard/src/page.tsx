'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProtectedRoute } from '@/app/components/auth/protected-route';
import { PageLayout } from '@/app/components/layout/page-layout';
import { Button } from '@/app/components/ui/button';
import NewsManagement from '@/app/components/news/news-management';
import ComplaintList from '@/app/components/complaints/complaint-list';
import SrcProjectManagement from '@/app/components/src-projects/src-project-management';


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
  activeProposals: number;
  newsPosts: number;
  recentActivity: number;
}



interface Proposal {
  id: string;
  title: string;
  student: string;
  department: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  createdAt: string;
}

// interface NewsPost {
//   id: string;
//   title: string;
//   status: 'draft' | 'published' | 'archived';
//   createdAt: string;
// }

export default function SRCDashboard() {
  const { session } = useSession();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintWithRelations | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);

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

  // Analytics data state - Removed since analytics is now a separate page

  // Check if there are any pending changes
  const hasPendingChanges = () => {
    return Object.values(pendingChanges).some(value => value !== undefined);
  };

  // Fetch analytics data - Removed since analytics is now a separate page

  // Mock data for other features
  const stats: DashboardStats = {
    pendingComplaints: complaints.filter(c => c.status === 'pending').length,
    activeProposals: 8,
    newsPosts: 15,
    recentActivity: 25,
  };

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
    
    console.log('Updating complaint with pending changes:', pendingChanges);
    
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

  // Load complaints on component mount
  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  // Load analytics data when analytics tab is selected - Removed since analytics is now a separate page

  const proposals: Proposal[] = [
    {
      id: '1',
      title: 'Campus WiFi Upgrade Project',
      student: 'Alice Brown',
      department: 'Computer Science',
      status: 'under_review',
      createdAt: '2024-01-15',
    },
    {
      id: '2',
      title: 'Student Wellness Center Initiative',
      student: 'Bob Wilson',
      department: 'Health Sciences',
      status: 'pending',
      createdAt: '2024-01-14',
    },
    {
      id: '3',
      title: 'Library Extension Proposal',
      student: 'Carol Davis',
      department: 'Education',
      status: 'approved',
      createdAt: '2024-01-13',
    },
  ];

  // Mock news posts data (unused but kept for future implementation)
  // const newsPosts: NewsPost[] = [
  //   {
  //     id: '1',
  //     title: 'Semester Schedule Update',
  //     status: 'published',
  //     createdAt: '2024-01-15',
  //   },
  //   {
  //     id: '2',
  //     title: 'SRC Election Results',
  //     status: 'published',
  //     createdAt: '2024-01-14',
  //   },
  //   {
  //     id: '3',
  //     title: 'Upcoming Events Calendar',
  //     status: 'draft',
  //     createdAt: '2024-01-13',
  //   },
  // ];



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      case 'under_review': return 'bg-purple-100 text-purple-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <ProtectedRoute requiredRole="src">
      <PageLayout>
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#2a6b39]">SRC Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage complaints, proposals, news, and student services</p>
          </div>

          {/* Navigation Tabs */}
          <div className="mb-6">
            <nav className="flex overflow-x-auto scrollbar-hide border-b border-gray-200">
              <div className="flex space-x-6 min-w-max px-4">
                {[
                  { id: 'overview', name: 'Overview', icon: '📊', shortName: 'Overview' },
                  { id: 'complaints', name: 'Complaints', icon: '⚠️', shortName: 'Complaints' },
                  { id: 'analytics', name: 'Analytics', icon: '📈', shortName: 'Analytics', href: '/dashboard/src/analytics' },
                  { id: 'proposals', name: 'Proposals', icon: '📋', shortName: 'Proposals' },
                  { id: 'src-projects', name: 'SRC Projects', icon: '🚀', shortName: 'Projects' },
                  { id: 'news', name: 'News & Announcements', icon: '📢', shortName: 'News' },
                  { id: 'communication', name: 'Communication', icon: '💬', shortName: 'Comm' },
                  { id: 'services', name: 'Student Services', icon: '👥', shortName: 'Services' },
                ].map((tab: { id: string; name: string; icon: string; shortName: string; href?: string }) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      console.log('🖱️ Tab clicked:', tab.id);
                      if ('href' in tab && tab.href) {
                        // Navigate to external page
                        window.location.href = tab.href;
                      } else {
                        // Set active tab for internal content
                        setActiveTab(tab.id);
                      }
                    }}
                    className={`py-2 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-[#359d49] text-[#359d49]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="mr-1 sm:mr-2">{tab.icon}</span>
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
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <span className="text-2xl">⚠️</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Pending Complaints</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.pendingComplaints}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <span className="text-2xl">📋</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Active Proposals</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.activeProposals}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <span className="text-2xl">📢</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">News Posts</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.newsPosts}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <span className="text-2xl">📈</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Recent Activity</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.recentActivity}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <span className="text-2xl">⏳</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Pending SRC Projects</p>
                      <p className="text-2xl font-bold text-yellow-600">-</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <Button
                    onClick={() => setShowNewsModal(true)}
                    className="bg-[#359d49] hover:bg-[#2a6b39] text-white"
                  >
                    📢 Create News
                  </Button>
                  <Button
                    onClick={() => setActiveTab('complaints')}
                    className="bg-[#359d49] hover:bg-[#2a6b39] text-white"
                  >
                    ⚠️ View Complaints
                  </Button>
                  <Button
                    onClick={() => setActiveTab('proposals')}
                    className="bg-[#359d49] hover:bg-[#2a6b39] text-white"
                  >
                    📋 Review Props
                  </Button>
                  <Button
                    onClick={() => setActiveTab('communication')}
                    className="bg-[#359d49] hover:bg-[#2a6b39] text-white"
                  >
                    💬 Comm Center
                  </Button>
                  <Button
                    onClick={() => setActiveTab('services')}
                    className="bg-[#359d49] hover:bg-[#2a6b39] text-white"
                  >
                    👥 Student Dir
                  </Button>
                  <Button
                    onClick={() => setActiveTab('src-projects')}
                    className="bg-[#359d49] hover:bg-[#2a6b39] text-white"
                  >
                    🚀 SRC Projects
                  </Button>
                  <Button
                    onClick={() => setActiveTab('services')}
                    className="bg-[#359d49] hover:bg-[#2a6b39] text-white"
                  >
                    📊 Reports
                  </Button>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="w-2 h-2 bg-red-400 rounded-full mr-3"></span>
                    New complaint from John Doe (Computer Science) - 2h ago
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                    Proposal &quot;Campus WiFi Upgrade&quot; approved - 4h ago
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                    News post &quot;Semester Schedule&quot; published - 6h ago
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></span>
                    Complaint #123 resolved - 1 day ago
                  </div>
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
                currentPage={currentPage}
                totalCount={totalCount}
                onPageChange={setCurrentPage}
                sortBy="created_at"
                sortOrder="desc"

              />
            </div>
          )}



          {/* Proposals Tab */}
          {activeTab === 'proposals' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900">Proposal Management</h2>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
                  <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49] sm:w-auto">
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="under_review">Under Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Search proposals..."
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49] flex-1 min-w-0"
                  />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                        <th className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                        <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {proposals.map((proposal) => (
                        <tr key={proposal.id} className="hover:bg-gray-50">
                          <td className="px-3 sm:px-6 py-4 text-sm font-medium text-gray-900">
                            <div>
                              <div className="font-medium">{proposal.title}</div>
                              <div className="text-xs text-gray-500 md:hidden">
                                Student: {proposal.student} • Date: {proposal.createdAt}
                              </div>
                            </div>
                          </td>
                          <td className="hidden md:table-cell px-3 sm:px-6 py-4 text-sm text-gray-900">{proposal.student}</td>
                          <td className="hidden lg:table-cell px-3 sm:px-6 py-4 text-sm text-gray-900">{proposal.department}</td>
                          <td className="px-3 sm:px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(proposal.status)}`}>
                              {proposal.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="hidden sm:table-cell px-3 sm:px-6 py-4 text-sm text-gray-900">{proposal.createdAt}</td>
                          <td className="px-3 sm:px-6 py-4 text-sm font-medium">
                            <Button
                              onClick={() => {
                                setSelectedProposal(proposal);
                                setShowProposalModal(true);
                              }}
                              className="bg-[#359d49] hover:bg-[#2a6b39] text-white text-xs px-2 sm:px-3 py-1"
                            >
                              Review
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SRC Projects Tab */}
          {activeTab === 'src-projects' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">SRC Project Management</h2>
                <p className="text-sm text-gray-600">Manage projects for your department</p>
              </div>
              <SrcProjectManagement userDepartment={session?.user?.user_metadata?.src_department || 'General'} />
            </div>
          )}

          {/* News Tab */}
          {activeTab === 'news' && (
            <NewsManagement />
          )}

          {/* Communication Tab */}
          {activeTab === 'communication' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Communication Center</h2>
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-gray-600">Communication features coming soon...</p>
              </div>
            </div>
          )}

          {/* Student Services Tab */}
          {activeTab === 'services' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Student Services</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Student Directory */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">👥 Student Directory</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Students</span>
                      <span className="text-sm font-medium text-gray-900">1,247</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Active Students</span>
                      <span className="text-sm font-medium text-gray-900">1,180</span>
                    </div>
                    <Button className="w-full bg-[#359d49] hover:bg-[#2a6b39] text-white">
                      View Directory
                    </Button>
                  </div>
                </div>

                {/* Department Management */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">🏢 Department Management</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Departments</span>
                      <span className="text-sm font-medium text-gray-900">8</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">SRC Representatives</span>
                      <span className="text-sm font-medium text-gray-900">24</span>
                    </div>
                    <Button className="w-full bg-[#359d49] hover:bg-[#2a6b39] text-white">
                      Manage Departments
                    </Button>
                  </div>
                </div>

                {/* Event Planning */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 Event Planning</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Upcoming Events</span>
                      <span className="text-sm font-medium text-gray-900">5</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Past Events</span>
                      <span className="text-sm font-medium text-gray-900">12</span>
                    </div>
                    <Button className="w-full bg-[#359d49] hover:bg-[#2a6b39] text-white">
                      Plan Event
                    </Button>
                  </div>
                </div>

                {/* Reports & Analytics */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Reports & Analytics</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Monthly Reports</span>
                      <span className="text-sm font-medium text-gray-900">3</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Analytics Dashboard</span>
                      <span className="text-sm font-medium text-gray-900">Active</span>
                    </div>
                    <Button className="w-full bg-[#359d49] hover:bg-[#2a6b39] text-white">
                      View Reports
                    </Button>
                  </div>
                </div>

                {/* File Management */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">📁 File Management</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Files</span>
                      <span className="text-sm font-medium text-gray-900">156</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Storage Used</span>
                      <span className="text-sm font-medium text-gray-900">2.3GB</span>
                    </div>
                    <Button className="w-full bg-[#359d49] hover:bg-[#2a6b39] text-white">
                      Manage Files
                    </Button>
                  </div>
                </div>

                {/* Settings */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">⚙️ Settings</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">System Status</span>
                      <span className="text-sm font-medium text-green-600">Online</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Last Backup</span>
                      <span className="text-sm font-medium text-gray-900">2h ago</span>
                    </div>
                    <Button className="w-full bg-[#359d49] hover:bg-[#2a6b39] text-white">
                      System Settings
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

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

          {/* Proposal Review Modal */}
          {showProposalModal && selectedProposal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Proposal Review</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">{selectedProposal.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">Submitted by {selectedProposal.student} from {selectedProposal.department}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Proposal Details</label>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="text-sm text-gray-700">
                        This is a placeholder for the full proposal content. In the real implementation, 
                        this would show the complete proposal details including objectives, budget, timeline, etc.
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Review Decision</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]">
                      <option value="pending">Pending</option>
                      <option value="under_review">Under Review</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Review Notes</label>
                    <textarea
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
                      placeholder="Enter your review notes and feedback..."
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      onClick={() => setShowProposalModal(false)}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-700"
                    >
                      Cancel
                    </Button>
                    <Button className="bg-[#359d49] hover:bg-[#2a6b39] text-white">
                      Submit Review
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </PageLayout>
    </ProtectedRoute>
  );
} 