'use client';

import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { ComplaintCategory, ComplaintPriority, ComplaintStatus, ComplaintWithRelations } from '@/types/supabase';

interface ComplaintListProps {
  complaints: ComplaintWithRelations[];
  loading?: boolean;
  onView?: (complaint: ComplaintWithRelations) => void;
  onEdit?: (complaint: ComplaintWithRelations) => void;
  onDelete?: (complaint: ComplaintWithRelations) => void;
  onAssign?: (complaint: ComplaintWithRelations) => void;
  onRespond?: (complaint: ComplaintWithRelations) => void;
  onClaim?: (complaint: ComplaintWithRelations, action: 'claim' | 'unclaim') => Promise<void>;
  userRole?: 'student' | 'src' | 'admin';
  currentUserId?: string;
  showFilters?: boolean;
  showPagination?: boolean;
  totalCount?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
}

const CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  academic: 'Academic',
  facilities: 'Facilities',
  security: 'Security',
  health: 'Health',
  transport: 'Transport',
  other: 'Other',
};

const PRIORITY_CONFIG: Record<ComplaintPriority, { label: string; color: string; bgColor: string }> = {
  low: { label: 'Low', color: 'text-green-800', bgColor: 'bg-green-100' },
  medium: { label: 'Medium', color: 'text-yellow-800', bgColor: 'bg-yellow-100' },
  high: { label: 'High', color: 'text-orange-800', bgColor: 'bg-orange-100' },
  urgent: { label: 'Urgent', color: 'text-red-800', bgColor: 'bg-red-100' },
};

const STATUS_CONFIG: Record<ComplaintStatus, { label: string; color: string; bgColor: string; icon: string }> = {
  pending: { label: 'Pending', color: 'text-yellow-800', bgColor: 'bg-yellow-100', icon: '⏳' },
  in_progress: { label: 'In Progress', color: 'text-blue-800', bgColor: 'bg-blue-100', icon: '🔄' },
  resolved: { label: 'Resolved', color: 'text-green-800', bgColor: 'bg-green-100', icon: '✅' },
  closed: { label: 'Closed', color: 'text-gray-800', bgColor: 'bg-gray-100', icon: '🔒' },
  rejected: { label: 'Rejected', color: 'text-red-800', bgColor: 'bg-red-100', icon: '❌' },
};

export default function ComplaintList({
  complaints,
  loading = false,
  onView,
  onEdit,
  onDelete,
  onAssign,
  onRespond,
  onClaim,
  userRole,
  currentUserId,
  showFilters = true,
  showPagination = true,
  totalCount = 0,
  currentPage = 1,
  pageSize = 10,
  onPageChange,
}: ComplaintListProps) {
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    priority: '',
    search: '',
  });

  const [sortBy, setSortBy] = useState<'created_at' | 'priority' | 'status'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSort = (field: 'created_at' | 'priority' | 'status') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleClaimAction = async (complaint: ComplaintWithRelations) => {
    if (!onClaim) return;
    
    const action = complaint.is_claimed && complaint.claimed_by_profile?.id === currentUserId ? 'unclaim' : 'claim';
    await onClaim(complaint, action);
  };

  const filteredComplaints = complaints.filter(complaint => {
    if (filters.status && complaint.status !== filters.status) return false;
    if (filters.category && complaint.category !== filters.category) return false;
    if (filters.priority && complaint.priority !== filters.priority) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        complaint.title.toLowerCase().includes(searchLower) ||
        complaint.description.toLowerCase().includes(searchLower) ||
        complaint.student?.full_name.toLowerCase().includes(searchLower) ||
        complaint.student?.student_id?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const sortedComplaints = [...filteredComplaints].sort((a, b) => {
    let aValue: number, bValue: number;

    switch (sortBy) {
      case 'created_at':
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
        break;
      case 'priority':
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        aValue = priorityOrder[a.priority as keyof typeof priorityOrder];
        bValue = priorityOrder[b.priority as keyof typeof priorityOrder];
        break;
      case 'status':
        const statusOrder = { pending: 1, in_progress: 2, resolved: 3, closed: 4, rejected: 5 };
        aValue = statusOrder[a.status as keyof typeof statusOrder];
        bValue = statusOrder[b.status as keyof typeof statusOrder];
        break;
      default:
        return 0;
    }

    if (sortOrder === 'asc') {
      return aValue - bValue;
    } else {
      return bValue - aValue;
    }
  });

  const totalPages = Math.ceil(totalCount / pageSize);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Filters */}
      {showFilters && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search complaints..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#359d49]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#359d49]"
              >
                <option value="">All Status</option>
                {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.icon} {config.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#359d49]"
              >
                <option value="">All Categories</option>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#359d49]"
              >
                <option value="">All Priorities</option>
                {Object.entries(PRIORITY_CONFIG).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => setFilters({ status: '', category: '', priority: '', search: '' })}
                className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 text-sm"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('created_at')}>
                <div className="flex items-center">
                  Date
                  {sortBy === 'created_at' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Target Department
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Claim Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('priority')}>
                <div className="flex items-center">
                  Priority
                  {sortBy === 'priority' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('status')}>
                <div className="flex items-center">
                  Status
                  {sortBy === 'status' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned To
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedComplaints.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-4 text-center text-gray-500">
                  No complaints found
                </td>
              </tr>
            ) : (
              sortedComplaints.map((complaint) => (
                <tr key={complaint.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(complaint.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                      {complaint.title}
                    </div>
                    <div className="text-sm text-gray-500 max-w-xs truncate">
                      {complaint.description.substring(0, 60)}...
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {complaint.student?.full_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {complaint.student?.student_id}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {CATEGORY_LABELS[complaint.category]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {complaint.target_department_names && complaint.target_department_names.length > 0 ? (
                      <div className="space-y-1">
                        {complaint.target_department_names.map((deptName, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${complaint.target_department_colors?.[index] || '#359d49'}20`,
                              color: complaint.target_department_colors?.[index] || '#359d49',
                              border: `1px solid ${complaint.target_department_colors?.[index] || '#359d49'}40`
                            }}
                          >
                            {deptName}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">All Departments</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {complaint.is_claimed ? (
                      <div className="space-y-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Claimed
                        </span>
                        {complaint.assigned_department_info && (
                          <div className="text-xs text-gray-600">
                            by {complaint.assigned_department_info.name}
                          </div>
                        )}
                        {complaint.claimed_by_profile && (
                          <div className="text-xs text-gray-500">
                            {complaint.claimed_by_profile.full_name}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Unclaimed
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PRIORITY_CONFIG[complaint.priority].bgColor} ${PRIORITY_CONFIG[complaint.priority].color}`}>
                      {PRIORITY_CONFIG[complaint.priority].label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[complaint.status].bgColor} ${STATUS_CONFIG[complaint.status].color}`}>
                      {STATUS_CONFIG[complaint.status].icon} {STATUS_CONFIG[complaint.status].label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {complaint.assigned_to ? (
                      <div>
                        <div className="font-medium">{complaint.assigned_to.full_name}</div>
                        <div className="text-gray-500 text-xs capitalize">{complaint.assigned_to.role}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {onView && (
                        <Button
                          onClick={() => onView(complaint)}
                          className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200"
                        >
                          View
                        </Button>
                      )}
                      {onEdit && (userRole === 'admin' || (userRole === 'student' && complaint.student_id === currentUserId)) && (
                        <Button
                          onClick={() => onEdit(complaint)}
                          className="text-xs bg-green-100 text-green-700 hover:bg-green-200"
                        >
                          Edit
                        </Button>
                      )}
                      {onAssign && (userRole === 'src' || userRole === 'admin') && !complaint.assigned_to && (
                        <Button
                          onClick={() => onAssign(complaint)}
                          className="text-xs bg-[#359d49] text-white hover:bg-[#2a6b39]"
                        >
                          Assign
                        </Button>
                      )}
                      {/* Claim/Unclaim Button for SRC members */}
                      {userRole === 'src' && !complaint.assigned_to && (
                        <Button
                          onClick={() => handleClaimAction(complaint)}
                          className={`text-xs ${
                            complaint.is_claimed && complaint.claimed_by_profile?.id === currentUserId
                              ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                        >
                          {complaint.is_claimed && complaint.claimed_by_profile?.id === currentUserId ? 'Unclaim' : 'Claim'}
                        </Button>
                      )}
                      {onRespond && (userRole === 'src' || userRole === 'admin') && 
                        (userRole === 'admin' || complaint.assigned_to?.id === currentUserId) && (
                        <Button
                          onClick={() => onRespond(complaint)}
                          className="text-xs bg-purple-100 text-purple-700 hover:bg-purple-200"
                        >
                          Respond
                        </Button>
                      )}
                      {onDelete && (userRole === 'admin' || (userRole === 'student' && complaint.student_id === currentUserId)) && (
                        <Button
                          onClick={() => onDelete(complaint)}
                          className="text-xs bg-red-100 text-red-700 hover:bg-red-200"
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button
                onClick={() => onPageChange?.(currentPage - 1)}
                disabled={currentPage <= 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Previous
              </Button>
              <Button
                onClick={() => onPageChange?.(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Next
              </Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * pageSize, totalCount)}
                  </span>{' '}
                  of <span className="font-medium">{totalCount}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <Button
                    onClick={() => onPageChange?.(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    Previous
                  </Button>
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        onClick={() => onPageChange?.(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === currentPage
                            ? 'z-10 bg-[#359d49] border-[#359d49] text-white'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </Button>
                    );
                  })}
                  <Button
                    onClick={() => onPageChange?.(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    Next
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 