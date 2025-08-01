'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/app/components/auth/protected-route';
import { PageLayout } from '@/app/components/layout/page-layout';
import { Button } from '@/app/components/ui/button';
import NewsDisplay from '@/app/components/news/news-display';
import FeaturedNews from '@/app/components/news/featured-news';
import ComplaintForm from '@/app/components/forms/complaint-form';
import ComplaintList from '@/app/components/complaints/complaint-list';
import ComplaintView from '@/app/components/forms/complaint-view';
import { ComplaintCategory, ComplaintPriority, ComplaintWithRelations } from '@/types/supabase';
import { useSession } from '@/app/contexts/session-context';



interface DashboardStats {
  myComplaints: number;
  myProposals: number;
  newsUpdates: number;
  chatMessages: number;
}

interface Proposal {
  id: string;
  title: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  createdAt: string;
  feedback?: string;
}

interface ChatMessage {
  id: string;
  from: string;
  message: string;
  timestamp: string;
  unread: boolean;
}

export default function StudentDashboard() {
  const { session } = useSession();
  const [activeTab, setActiveTab] = useState('overview');
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintWithRelations | null>(null);
  const [complaints, setComplaints] = useState<ComplaintWithRelations[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Mock data for other features
  const stats: DashboardStats = {
    myComplaints: complaints.length,
    myProposals: 2,
    newsUpdates: 5,
    chatMessages: 1,
  };

  const proposals: Proposal[] = [
    {
      id: '1',
      title: 'Campus WiFi Upgrade Project',
      status: 'under_review',
      createdAt: '2024-01-15',
      feedback: 'Your proposal is being reviewed by the technical committee.',
    },
    {
      id: '2',
      title: 'Student Lounge Renovation',
      status: 'pending',
      createdAt: '2024-01-14',
    },
  ];

  const chatMessages: ChatMessage[] = [
    {
      id: '1',
      from: 'SRC Member',
      message: 'We have received your complaint and are working on it.',
      timestamp: '2024-01-15 10:30',
      unread: true,
    },
  ];

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
    } catch (error) {
      alert('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  // Submit new complaint
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

      if (response.ok) {
        const data = await response.json();
        setComplaints(prev => [data.complaint, ...prev]);
        setShowComplaintModal(false);
        // Refresh complaints list
        fetchComplaints(currentPage);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
          } catch (error) {
        alert('Failed to submit complaint. Please try again.');
      } finally {
      setIsSubmitting(false);
    }
  };

  // Handle complaint actions
  const handleViewComplaint = (complaint: ComplaintWithRelations) => {
    setSelectedComplaint(complaint);
  };

  const handleEditComplaint = (complaint: ComplaintWithRelations) => {
    // Set the complaint and enable edit mode
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
    
    // Prevent duplicate submissions
    if (isSubmitting) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/complaints/${selectedComplaint.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        
        setComplaints(prev => prev.map(c => c.id === selectedComplaint.id ? data.complaint : c));
        setSelectedComplaint(data.complaint);
        setEditMode(false);
        alert('Complaint updated successfully!');
        
        // Force a refresh to ensure we have the latest data from the database
        setTimeout(() => {
          fetchComplaints(currentPage);
        }, 100);
      } else {
        const errorData = await response.json();
        alert(`Failed to update complaint: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert('Failed to update complaint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
  };

  const handleDeleteComplaint = async (complaint: ComplaintWithRelations) => {
    if (confirm('Are you sure you want to delete this complaint?')) {
      try {
        const response = await fetch(`/api/complaints/${complaint.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setComplaints(prev => prev.filter(c => c.id !== complaint.id));
          if (selectedComplaint?.id === complaint.id) {
            setSelectedComplaint(null);
          }
        } else {
          alert('Failed to delete complaint');
        }
      } catch (error) {
        alert('Failed to delete complaint');
      }
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

  const tabs = [
    { id: 'overview', name: 'Overview', shortName: 'Overview', icon: '📊' },
    { id: 'news', name: 'News & Updates', shortName: 'News', icon: '📢' },
    { id: 'complaints', name: 'My Complaints', shortName: 'Complaints', icon: '⚠️' },
    { id: 'proposals', name: 'My Proposals', shortName: 'Proposals', icon: '📋' },
    { id: 'chat', name: 'Chat', shortName: 'Chat', icon: '💬' },
    { id: 'forums', name: 'Forums', shortName: 'Forums', icon: '📝' },
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
              Welcome back, {session?.user?.user_metadata?.full_name || 'Student'}!
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="mb-8">
            <nav className="flex space-x-8">
              <div className="flex space-x-1">
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
                      <p className="text-sm font-medium text-gray-600">My Complaints</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.myComplaints}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <span className="text-2xl">📋</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">My Proposals</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.myProposals}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <span className="text-2xl">📢</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">News Updates</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.newsUpdates}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <span className="text-2xl">💬</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Chat Messages</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.chatMessages}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <Button
                    onClick={() => setShowComplaintModal(true)}
                    className="bg-[#359d49] hover:bg-[#2a6b39] text-white"
                  >
                    ⚠️ Submit Complaint
                  </Button>
                  <Button
                    onClick={() => setShowProposalModal(true)}
                    className="bg-[#359d49] hover:bg-[#2a6b39] text-white"
                  >
                    📋 Submit Proposal
                  </Button>
                  <Button
                    onClick={() => setShowChatModal(true)}
                    className="bg-[#359d49] hover:bg-[#2a6b39] text-white"
                  >
                    💬 Start Chat
                  </Button>
                  <Button
                    onClick={() => setActiveTab('news')}
                    className="bg-[#359d49] hover:bg-[#2a6b39] text-white"
                  >
                    📢 View News
                  </Button>
                  <Button
                    onClick={() => setActiveTab('forums')}
                    className="bg-[#359d49] hover:bg-[#2a6b39] text-white"
                  >
                    📝 Join Forum
                  </Button>
                  <Button
                    onClick={() => setActiveTab('complaints')}
                    className="bg-[#359d49] hover:bg-[#2a6b39] text-white"
                  >
                    📋 View Complaints
                  </Button>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Complaints */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Complaints</h3>
                  {complaints.slice(0, 3).length > 0 ? (
                    <div className="space-y-3">
                      {complaints.slice(0, 3).map((complaint) => (
                        <div
                          key={complaint.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                          onClick={() => handleViewComplaint(complaint)}
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{complaint.title}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(complaint.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            complaint.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            complaint.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            complaint.status === 'resolved' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {complaint.status.replace('_', ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No complaints yet</p>
                  )}
                  <Button
                    onClick={() => setActiveTab('complaints')}
                    className="mt-4 w-full bg-gray-100 hover:bg-gray-200 text-gray-700"
                  >
                    View All Complaints
                  </Button>
                </div>

                {/* Recent News */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent News</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">Campus WiFi Maintenance</p>
                      <p className="text-xs text-gray-500">Scheduled for this weekend</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">Student Council Elections</p>
                      <p className="text-xs text-gray-500">Nominations now open</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">Library Extended Hours</p>
                      <p className="text-xs text-gray-500">During exam period</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setActiveTab('news')}
                    className="mt-4 w-full bg-gray-100 hover:bg-gray-200 text-gray-700"
                  >
                    View All News
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* News Tab */}
          {activeTab === 'news' && (
            <div className="space-y-6">
              <FeaturedNews />
              <NewsDisplay />
            </div>
          )}

          {/* Complaints Tab */}
          {activeTab === 'complaints' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">My Complaints</h2>
                <Button
                  onClick={() => setShowComplaintModal(true)}
                  className="bg-[#359d49] hover:bg-[#2a6b39] text-white"
                >
                  + Submit New Complaint
                </Button>
              </div>

              <ComplaintList
                complaints={complaints}
                loading={loading}
                onView={handleViewComplaint}
                onEdit={handleEditComplaint}
                onDelete={handleDeleteComplaint}
                userRole="student"
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
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">My Proposals</h2>
                <Button
                  onClick={() => setShowProposalModal(true)}
                  className="bg-[#359d49] hover:bg-[#2a6b39] text-white"
                >
                  + Submit New Proposal
                </Button>
              </div>

              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {proposals.map((proposal) => (
                      <tr key={proposal.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{proposal.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            proposal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            proposal.status === 'under_review' ? 'bg-blue-100 text-blue-800' :
                            proposal.status === 'approved' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {proposal.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {proposal.createdAt}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-[#359d49] hover:text-[#2a6b39] mr-3">
                            View
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Chat with SRC</h2>
                <Button
                  onClick={() => setShowChatModal(true)}
                  className="bg-[#359d49] hover:bg-[#2a6b39] text-white"
                >
                  + Start New Chat
                </Button>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="space-y-4">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 rounded-lg ${
                        message.unread ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{message.from}</p>
                          <p className="text-sm text-gray-600 mt-1">{message.message}</p>
                        </div>
                        <div className="text-xs text-gray-500">{message.timestamp}</div>
                      </div>
                      {message.unread && (
                        <span className="inline-block mt-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          New
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Forums Tab */}
          {activeTab === 'forums' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Discussion Forums</h2>
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-gray-600">Forum functionality coming soon...</p>
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {session?.user?.user_metadata?.full_name || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{session?.user?.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Student ID</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {session?.user?.user_metadata?.student_id || 'Not set'}
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
                <ComplaintForm
                  onSubmit={handleSubmitComplaint}
                  onCancel={() => setShowComplaintModal(false)}
                  isSubmitting={isSubmitting}
                />
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
              </div>
            </div>
          </div>
        )}

        {/* Proposal Modal */}
        {showProposalModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Submit New Proposal</h3>
                  <button
                    onClick={() => setShowProposalModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-gray-600">Proposal form coming soon...</p>
              </div>
            </div>
          </div>
        )}

        {/* Chat Modal */}
        {showChatModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Start New Chat</h3>
                  <button
                    onClick={() => setShowChatModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-gray-600">Chat functionality coming soon...</p>
              </div>
            </div>
          </div>
        )}
      </PageLayout>
    </ProtectedRoute>
  );
} 