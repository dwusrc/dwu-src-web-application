'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/app/components/auth/protected-route';
import { PageLayout } from '@/app/components/layout/page-layout';
import { Button } from '@/app/components/ui/button';
import NewsManagement from '@/app/components/news/news-management';

interface DashboardStats {
  pendingComplaints: number;
  activeProposals: number;
  newsPosts: number;
  recentActivity: number;
}

interface Complaint {
  id: string;
  title: string;
  student: string;
  department: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
}

interface Proposal {
  id: string;
  title: string;
  student: string;
  department: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  createdAt: string;
}

interface NewsPost {
  id: string;
  title: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
}

export default function SRCDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);

  // Mock data for UX demonstration
  const stats: DashboardStats = {
    pendingComplaints: 12,
    activeProposals: 8,
    newsPosts: 15,
    recentActivity: 25,
  };

  const complaints: Complaint[] = [
    {
      id: '1',
      title: 'WiFi connectivity issues in Library',
      student: 'John Doe',
      department: 'Computer Science',
      category: 'facilities',
      priority: 'high',
      status: 'pending',
      createdAt: '2024-01-15',
    },
    {
      id: '2',
      title: 'Request for additional study spaces',
      student: 'Jane Smith',
      department: 'Business',
      category: 'facilities',
      priority: 'medium',
      status: 'in_progress',
      createdAt: '2024-01-14',
    },
    {
      id: '3',
      title: 'Cafeteria food quality concerns',
      student: 'Mike Johnson',
      department: 'Health Sciences',
      category: 'other',
      priority: 'low',
      status: 'resolved',
      createdAt: '2024-01-13',
    },
  ];

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

  const newsPosts: NewsPost[] = [
    {
      id: '1',
      title: 'Semester Schedule Update',
      status: 'published',
      createdAt: '2024-01-15',
    },
    {
      id: '2',
      title: 'SRC Election Results',
      status: 'published',
      createdAt: '2024-01-14',
    },
    {
      id: '3',
      title: 'Upcoming Events Calendar',
      status: 'draft',
      createdAt: '2024-01-13',
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
            <nav className="flex space-x-8 border-b border-gray-200">
              {[
                { id: 'overview', name: 'Overview', icon: '📊' },
                { id: 'complaints', name: 'Complaints', icon: '⚠️' },
                { id: 'proposals', name: 'Proposals', icon: '📋' },
                { id: 'news', name: 'News & Announcements', icon: '📢' },
                { id: 'communication', name: 'Communication', icon: '💬' },
                { id: 'services', name: 'Student Services', icon: '👥' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-[#359d49] text-[#359d49]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
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
                <div className="flex space-x-2">
                  <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]">
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                  <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]">
                    <option value="">All Categories</option>
                    <option value="academic">Academic</option>
                    <option value="facilities">Facilities</option>
                    <option value="security">Security</option>
                    <option value="health">Health</option>
                    <option value="transport">Transport</option>
                    <option value="other">Other</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Search complaints..."
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
                  />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {complaints.map((complaint) => (
                      <tr key={complaint.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{complaint.title}</div>
                          <div className="text-sm text-gray-500">{complaint.category}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{complaint.student}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{complaint.department}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(complaint.priority)}`}>
                            {complaint.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(complaint.status)}`}>
                            {complaint.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button
                            onClick={() => {
                              setSelectedComplaint(complaint);
                              setShowComplaintModal(true);
                            }}
                            className="bg-[#359d49] hover:bg-[#2a6b39] text-white text-xs px-3 py-1"
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Proposals Tab */}
          {activeTab === 'proposals' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Proposal Management</h2>
                <div className="flex space-x-2">
                  <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]">
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="under_review">Under Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Search proposals..."
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
                  />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {proposals.map((proposal) => (
                      <tr key={proposal.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{proposal.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{proposal.student}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{proposal.department}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(proposal.status)}`}>
                            {proposal.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{proposal.createdAt}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button
                            onClick={() => {
                              setSelectedProposal(proposal);
                              setShowProposalModal(true);
                            }}
                            className="bg-[#359d49] hover:bg-[#2a6b39] text-white text-xs px-3 py-1"
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
          )}

          {/* News Tab */}
          {activeTab === 'news' && (
            <NewsManagement />
          )}

          {/* Communication Tab */}
          {activeTab === 'communication' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Communication Tools</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Chat Moderation */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">💬 Chat Moderation</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Active Conversations</span>
                      <span className="text-sm font-medium text-gray-900">12</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Pending Messages</span>
                      <span className="text-sm font-medium text-gray-900">5</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Flagged Messages</span>
                      <span className="text-sm font-medium text-red-600">2</span>
                    </div>
                    <Button className="w-full bg-[#359d49] hover:bg-[#2a6b39] text-white">
                      View Chat Dashboard
                    </Button>
                  </div>
                </div>

                {/* Forum Moderation */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">📝 Forum Moderation</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Active Topics</span>
                      <span className="text-sm font-medium text-gray-900">8</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">New Posts</span>
                      <span className="text-sm font-medium text-gray-900">15</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Flagged Posts</span>
                      <span className="text-sm font-medium text-red-600">3</span>
                    </div>
                    <Button className="w-full bg-[#359d49] hover:bg-[#2a6b39] text-white">
                      View Forum Dashboard
                    </Button>
                  </div>
                </div>

                {/* Notifications */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">🔔 Notifications</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Pending Notifications</span>
                      <span className="text-sm font-medium text-gray-900">7</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Sent Today</span>
                      <span className="text-sm font-medium text-gray-900">12</span>
                    </div>
                    <Button className="w-full bg-[#359d49] hover:bg-[#2a6b39] text-white">
                      Send Notification
                    </Button>
                  </div>
                </div>

                {/* Email Templates */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">📧 Email Templates</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Available Templates</span>
                      <span className="text-sm font-medium text-gray-900">5</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Sent This Week</span>
                      <span className="text-sm font-medium text-gray-900">23</span>
                    </div>
                    <Button className="w-full bg-[#359d49] hover:bg-[#2a6b39] text-white">
                      Manage Templates
                    </Button>
                  </div>
                </div>
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
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Complaint Details</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">{selectedComplaint.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">Submitted by {selectedComplaint.student} from {selectedComplaint.department}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]">
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]">
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
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
                      placeholder="Enter your response to the student..."
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      onClick={() => setShowComplaintModal(false)}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-700"
                    >
                      Cancel
                    </Button>
                    <Button className="bg-[#359d49] hover:bg-[#2a6b39] text-white">
                      Update Complaint
                    </Button>
                  </div>
                </div>
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