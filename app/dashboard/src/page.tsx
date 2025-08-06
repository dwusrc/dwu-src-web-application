'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { ProtectedRoute } from '@/app/components/auth/protected-route';
import { PageLayout } from '@/app/components/layout/page-layout';
import { Button } from '@/app/components/ui/button';
import NewsManagement from '@/app/components/news/news-management';
import ComplaintList from '@/app/components/complaints/complaint-list';

// Lazy load chat interfaces
const SRCChatInterface = lazy(() => import('@/app/components/chat/src-chat-interface'));

import { Complaint, ComplaintStatus } from '@/types/supabase';
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
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

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
  const fetchComplaints = async (page: number = 1) => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  // Handle complaint actions
  const handleViewComplaint = (complaint: ComplaintWithRelations) => {
    setSelectedComplaint(complaint);
    setShowComplaintModal(true);
  };

  const handleAssignComplaint = async (complaint: ComplaintWithRelations) => {
    try {
      const response = await fetch(`/api/complaints/${complaint.id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assigned_to: session?.user?.id }),
      });

      if (response.ok) {
        const data = await response.json();
        setComplaints(prev => prev.map(c => c.id === complaint.id ? data.complaint : c));
        if (selectedComplaint?.id === complaint.id) {
          setSelectedComplaint(data.complaint);
        }
        alert('Complaint assigned successfully');
      } else {
        alert('Failed to assign complaint');
      }
    } catch {
      alert('Failed to assign complaint');
    }
  };

  const handleRespondToComplaint = async (complaint: ComplaintWithRelations) => {
    // Open the complaint view modal for responding
    setSelectedComplaint(complaint);
    setShowComplaintModal(true);
  };

  const handleUpdateStatus = async (complaint: ComplaintWithRelations, status: ComplaintStatus) => {
    try {
      const response = await fetch(`/api/complaints/${complaint.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        const data = await response.json();
        setComplaints(prev => prev.map(c => c.id === complaint.id ? data.complaint : c));
        if (selectedComplaint?.id === complaint.id) {
          setSelectedComplaint(data.complaint);
        }
      } else {
        alert('Failed to update complaint status');
      }
    } catch {
      alert('Failed to update complaint status');
    }
  };

  const handleUpdateComplaint = async () => {
    if (!selectedComplaint) return;
    
    // Get form data from the modal
    const form = document.querySelector('#complaint-modal form');
    if (!form) return;
    
    const formData = new FormData(form as HTMLFormElement);
    const updateData = {
      status: formData.get('status') as string,
      priority: formData.get('priority') as string,
      response: formData.get('response') as string,
    };

    try {
      const response = await fetch(`/api/complaints/${selectedComplaint.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const data = await response.json();
        setComplaints(prev => prev.map(c => c.id === selectedComplaint.id ? data.complaint : c));
        setSelectedComplaint(data.complaint);
        setShowComplaintModal(false);
        alert('Complaint updated successfully');
      } else {
        const errorData = await response.json();
        alert(`Failed to update complaint: ${errorData.error}`);
      }
    } catch {
      alert('Failed to update complaint');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchComplaints(page);
  };

  // Load complaints on component mount
  useEffect(() => {
    fetchComplaints();
  }, []);

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
                  { id: 'proposals', name: 'Proposals', icon: '📋', shortName: 'Proposals' },
                  { id: 'news', name: 'News & Announcements', icon: '📢', shortName: 'News' },
                  { id: 'communication', name: 'Communication', icon: '💬', shortName: 'Comm' },
                  { id: 'services', name: 'Student Services', icon: '👥', shortName: 'Services' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
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
                    💬 Chat Mod
                  </Button>
                  <Button
                    onClick={() => setActiveTab('services')}
                    className="bg-[#359d49] hover:bg-[#2a6b39] text-white"
                  >
                    👥 Student Dir
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
                loading={loading}
                onView={(complaint) => handleViewComplaint(complaint as ComplaintWithRelations)}
                onAssign={(complaint) => handleAssignComplaint(complaint as ComplaintWithRelations)}
                onRespond={(complaint) => handleRespondToComplaint(complaint as ComplaintWithRelations)}
                userRole="src"
                currentUserId={session?.user?.id}
                showFilters={true}
                showPagination={true}
                totalCount={totalCount}
                currentPage={currentPage}
                pageSize={10}
                onPageChange={handlePageChange}
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

          {/* News Tab */}
          {activeTab === 'news' && (
            <NewsManagement />
          )}

          {/* Communication Tab */}
          {activeTab === 'communication' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Student Chat Management</h2>
                <div className="text-sm text-gray-600">
                  Manage conversations with students from your department
                </div>
              </div>
              
              {/* Chat Interface */}
              <div className="bg-white rounded-lg shadow-md" style={{ minHeight: '600px', maxHeight: '80vh' }}>
                <Suspense fallback={
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#359d49] mx-auto mb-2"></div>
                      <p className="text-gray-600">Loading chat interface...</p>
                    </div>
                  </div>
                }>
                  <SRCChatInterface />
                </Suspense>
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
                </div>
                <form className="p-6 space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">{selectedComplaint.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">Submitted by {selectedComplaint.student?.full_name} from {selectedComplaint.student?.department}</p>
                    <p className="text-sm text-gray-600 mt-2">{selectedComplaint.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select 
                        name="status"
                        defaultValue={selectedComplaint.status}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                      <select 
                        name="priority"
                        defaultValue={selectedComplaint.priority}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Response</label>
                    <textarea
                      name="response"
                      rows={4}
                      defaultValue={selectedComplaint.response || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
                      placeholder="Enter your response to the student..."
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      onClick={() => setShowComplaintModal(false)}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-700"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="button"
                      onClick={handleUpdateComplaint}
                      className="bg-[#359d49] hover:bg-[#2a6b39] text-white"
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