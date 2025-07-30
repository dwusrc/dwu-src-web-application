'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/app/components/auth/protected-route';
import { PageLayout } from '@/app/components/layout/page-layout';
import { Button } from '@/app/components/ui/button';
import NewsDisplay from '@/app/components/news/news-display';
import FeaturedNews from '@/app/components/news/featured-news';

interface DashboardStats {
  myComplaints: number;
  myProposals: number;
  newsUpdates: number;
  chatMessages: number;
}

interface Complaint {
  id: string;
  title: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  response?: string;
}

interface Proposal {
  id: string;
  title: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  createdAt: string;
  feedback?: string;
}

// interface NewsPost {
//   id: string;
//   title: string;
//   excerpt: string;
//   category: string;
//   createdAt: string;
//   featured: boolean;
// }

interface ChatMessage {
  id: string;
  from: string;
  message: string;
  timestamp: string;
  unread: boolean;
}

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  // Mock data for UX demonstration
  const stats: DashboardStats = {
    myComplaints: 3,
    myProposals: 2,
    newsUpdates: 5,
    chatMessages: 1,
  };

  const complaints: Complaint[] = [
    {
      id: '1',
      title: 'WiFi connectivity issues in Library',
      category: 'facilities',
      priority: 'high',
      status: 'in_progress',
      createdAt: '2024-01-15',
      response: 'We are investigating the WiFi issues. Expected resolution within 2 days.',
    },
    {
      id: '2',
      title: 'Request for additional study spaces',
      category: 'facilities',
      priority: 'medium',
      status: 'pending',
      createdAt: '2024-01-14',
    },
    {
      id: '3',
      title: 'Cafeteria food quality concerns',
      category: 'other',
      priority: 'low',
      status: 'resolved',
      createdAt: '2024-01-13',
      response: 'Issue has been addressed with the cafeteria management.',
    },
  ];

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
      title: 'Student Wellness Center Initiative',
      status: 'pending',
      createdAt: '2024-01-14',
    },
  ];

  // Mock news posts data (unused but kept for future implementation)
  // const newsPosts: NewsPost[] = [
  //   {
  //     id: '1',
  //     title: 'Semester Schedule Update',
  //     excerpt: 'Important changes to the semester schedule have been announced...',
  //     category: 'academic',
  //     createdAt: '2024-01-15',
  //     featured: true,
  //   },
  //   {
  //     id: '2',
  //     title: 'SRC Election Results',
  //     excerpt: 'The results of the Student Representative Council elections...',
  //     category: 'general',
  //     createdAt: '2024-01-14',
  //     featured: false,
  //   },
  //   {
  //     id: '3',
  //     title: 'Upcoming Events Calendar',
  //     excerpt: 'Check out the exciting events planned for this semester...',
  //     category: 'events',
  //     createdAt: '2024-01-13',
  //     featured: false,
  //   },
  // ];

  const chatMessages: ChatMessage[] = [
    {
      id: '1',
      from: 'SRC Representative',
      message: 'We have received your complaint and are working on it.',
      timestamp: '2h ago',
      unread: true,
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
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <ProtectedRoute requiredRole="student">
      <PageLayout>
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#2a6b39]">Student Dashboard</h1>
            <p className="text-gray-600 mt-2">Submit complaints, proposals, and stay updated with campus news</p>
          </div>

          {/* Navigation Tabs */}
          <div className="mb-6">
            <nav className="flex space-x-8 border-b border-gray-200">
              {[
                { id: 'overview', name: 'Overview', icon: '📊' },
                { id: 'news', name: 'News & Updates', icon: '📢' },
                { id: 'complaints', name: 'My Complaints', icon: '⚠️' },
                { id: 'proposals', name: 'My Proposals', icon: '📋' },
                { id: 'chat', name: 'Chat', icon: '💬' },
                { id: 'forums', name: 'Forums', icon: '📝' },
                { id: 'profile', name: 'Profile', icon: '👤' },
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
                    onClick={() => setActiveTab('profile')}
                    className="bg-[#359d49] hover:bg-[#2a6b39] text-white"
                  >
                    👤 My Profile
                  </Button>
                </div>
              </div>

              {/* Featured News */}
              <FeaturedNews limit={3} showViewAll={true} />

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                    Complaint &quot;WiFi Issues&quot; status updated to &quot;In Progress&quot;
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                    SRC responded to your proposal &quot;Campus WiFi Upgrade&quot;
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                    New news post: &quot;Semester Schedule Update&quot;
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="w-2 h-2 bg-orange-400 rounded-full mr-3"></span>
                    New message from SRC representative
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* News Tab */}
          {activeTab === 'news' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">News & Updates</h2>
              <NewsDisplay limit={12} showFilters={true} showPagination={true} />
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
                  ⚠️ Submit New Complaint
                </Button>
              </div>

              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {complaints.map((complaint) => (
                      <tr key={complaint.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{complaint.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{complaint.category}</td>
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{complaint.createdAt}</td>
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
                <h2 className="text-2xl font-bold text-gray-900">My Proposals</h2>
                <Button
                  onClick={() => setShowProposalModal(true)}
                  className="bg-[#359d49] hover:bg-[#2a6b39] text-white"
                >
                  📋 Submit New Proposal
                </Button>
              </div>

              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {proposals.map((proposal) => (
                      <tr key={proposal.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{proposal.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(proposal.status)}`}>
                            {proposal.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{proposal.createdAt}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button className="bg-[#359d49] hover:bg-[#2a6b39] text-white text-xs px-3 py-1">
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

          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Student Chat</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chat List */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversations</h3>
                    <div className="space-y-3">
                      {chatMessages.map((message) => (
                        <div key={message.id} className={`p-3 rounded-lg cursor-pointer ${message.unread ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 hover:bg-gray-100'}`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">{message.from}</p>
                              <p className="text-sm text-gray-600 truncate">{message.message}</p>
                            </div>
                            <div className="text-xs text-gray-500">{message.timestamp}</div>
                          </div>
                          {message.unread && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          )}
                        </div>
                      ))}
                    </div>
                    <Button
                      onClick={() => setShowChatModal(true)}
                      className="w-full mt-4 bg-[#359d49] hover:bg-[#2a6b39] text-white"
                    >
                      Start New Chat
                    </Button>
                  </div>
                </div>

                {/* Chat Interface */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-lg shadow-md h-96 flex flex-col">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">Chat with SRC Representative</h3>
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto">
                      <div className="space-y-4">
                        <div className="flex justify-end">
                          <div className="bg-[#359d49] text-white p-3 rounded-lg max-w-xs">
                            <p className="text-sm">Hi, I have a question about the WiFi issues in the library.</p>
                          </div>
                        </div>
                        <div className="flex justify-start">
                          <div className="bg-gray-100 p-3 rounded-lg max-w-xs">
                            <p className="text-sm">Hello! We have received your complaint and are working on it. Expected resolution within 2 days.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 border-t border-gray-200">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          placeholder="Type your message..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
                        />
                        <Button className="bg-[#359d49] hover:bg-[#2a6b39] text-white">
                          Send
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Forums Tab */}
          {activeTab === 'forums' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Discussion Forums</h2>
                <Button className="bg-[#359d49] hover:bg-[#2a6b39] text-white">
                  📝 Create New Post
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* General Discussions */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">💬 General Discussions</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Active Topics</span>
                      <span className="text-sm font-medium text-gray-900">12</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Recent Posts</span>
                      <span className="text-sm font-medium text-gray-900">8</span>
                    </div>
                    <Button className="w-full bg-[#359d49] hover:bg-[#2a6b39] text-white">
                      Join Discussion
                    </Button>
                  </div>
                </div>

                {/* Academic Discussions */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">📚 Academic Discussions</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Active Topics</span>
                      <span className="text-sm font-medium text-gray-900">8</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Recent Posts</span>
                      <span className="text-sm font-medium text-gray-900">5</span>
                    </div>
                    <Button className="w-full bg-[#359d49] hover:bg-[#2a6b39] text-white">
                      Join Discussion
                    </Button>
                  </div>
                </div>

                {/* Department Forums */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">🏢 Department Forums</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Active Topics</span>
                      <span className="text-sm font-medium text-gray-900">6</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Recent Posts</span>
                      <span className="text-sm font-medium text-gray-900">3</span>
                    </div>
                    <Button className="w-full bg-[#359d49] hover:bg-[#2a6b39] text-white">
                      Join Discussion
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Profile Information */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900">
                        John Doe
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                      <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900">
                        2024001
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                      <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900">
                        Computer Science
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Year Level</label>
                      <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900">
                        3rd Year
                      </div>
                    </div>
                    <Button className="w-full bg-[#359d49] hover:bg-[#2a6b39] text-white">
                      Update Profile
                    </Button>
                  </div>
                </div>

                {/* Activity Summary */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Summary</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Complaints Submitted</span>
                      <span className="text-sm font-medium text-gray-900">3</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Proposals Submitted</span>
                      <span className="text-sm font-medium text-gray-900">2</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Forum Posts</span>
                      <span className="text-sm font-medium text-gray-900">5</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Chat Conversations</span>
                      <span className="text-sm font-medium text-gray-900">8</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Member Since</span>
                      <span className="text-sm font-medium text-gray-900">January 2024</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modals */}
          {/* Complaint Submission Modal */}
          {showComplaintModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedComplaint ? 'View Complaint' : 'Submit New Complaint'}
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  {selectedComplaint ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900">{selectedComplaint.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">Category: {selectedComplaint.category}</p>
                        <p className="text-sm text-gray-600">Priority: {selectedComplaint.priority}</p>
                        <p className="text-sm text-gray-600">Status: {selectedComplaint.status.replace('_', ' ')}</p>
                      </div>
                      {selectedComplaint.response && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">SRC Response</label>
                          <div className="bg-gray-50 p-3 rounded-md">
                            <p className="text-sm text-gray-700">{selectedComplaint.response}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
                          placeholder="Brief description of your complaint..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]">
                          <option value="">Select category</option>
                          <option value="academic">Academic</option>
                          <option value="facilities">Facilities</option>
                          <option value="security">Security</option>
                          <option value="health">Health</option>
                          <option value="transport">Transport</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]">
                          <option value="">Select priority</option>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                        <textarea
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
                          placeholder="Please provide detailed description of your complaint..."
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      onClick={() => {
                        setShowComplaintModal(false);
                        setSelectedComplaint(null);
                      }}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-700"
                    >
                      {selectedComplaint ? 'Close' : 'Cancel'}
                    </Button>
                    {!selectedComplaint && (
                      <Button className="bg-[#359d49] hover:bg-[#2a6b39] text-white">
                        Submit Complaint
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Proposal Submission Modal */}
          {showProposalModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Submit New Proposal</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
                      placeholder="Project title..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                    <textarea
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
                      placeholder="Describe your project proposal..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Objectives *</label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
                      placeholder="What are the main objectives of this project?"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Budget (USD)</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Timeline (months)</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
                        placeholder="1"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      onClick={() => setShowProposalModal(false)}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-700"
                    >
                      Cancel
                    </Button>
                    <Button className="bg-[#359d49] hover:bg-[#2a6b39] text-white">
                      Submit Proposal
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chat Modal */}
          {showChatModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Start New Chat</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Recipient</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]">
                      <option value="">Choose SRC representative...</option>
                      <option value="general">General SRC Representative</option>
                      <option value="academic">Academic Affairs Representative</option>
                      <option value="facilities">Facilities Representative</option>
                      <option value="student-life">Student Life Representative</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
                      placeholder="Brief subject of your message..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <textarea
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
                      placeholder="Type your message here..."
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      onClick={() => setShowChatModal(false)}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-700"
                    >
                      Cancel
                    </Button>
                    <Button className="bg-[#359d49] hover:bg-[#2a6b39] text-white">
                      Start Chat
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