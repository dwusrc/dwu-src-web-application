'use client';

import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { ComplaintCategory, ComplaintPriority, ComplaintStatus, ComplaintWithRelations } from '@/types/supabase';

interface ComplaintListProps {
  complaints: ComplaintWithRelations[];
  onView: (complaint: ComplaintWithRelations) => void;
  currentPage: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
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

const STATUS_CONFIG: Record<ComplaintStatus, { label: string; icon: string; bgColor: string; color: string }> = {
  pending: { label: 'Pending', icon: '⏳', bgColor: 'bg-yellow-100', color: 'text-yellow-800' },
  in_progress: { label: 'In Progress', icon: '🔄', bgColor: 'bg-blue-100', color: 'text-blue-800' },
  resolved: { label: 'Resolved', icon: '✅', bgColor: 'bg-green-100', color: 'text-green-800' },
  closed: { label: 'Closed', icon: '🔒', bgColor: 'bg-gray-100', color: 'text-gray-800' },
  rejected: { label: 'Rejected', icon: '❌', bgColor: 'bg-red-100', color: 'text-red-800' },
};

export default function ComplaintList({
  complaints,
  onView,
  currentPage,
  totalCount,
  onPageChange,
  sortBy,
  sortOrder,
  onSort
}: ComplaintListProps) {
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    department: '',
    category: '',
    dateFrom: '',
    dateTo: ''
  });

  const [localSortBy, setLocalSortBy] = useState(sortBy);
  const [localSortOrder, setLocalSortOrder] = useState(sortOrder);
  const pageSize = 10;
  const loading = false;
  const showFilters = true;
  const showPagination = true;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSort = (field: 'created_at' | 'priority' | 'status') => {
    if (localSortBy === field) {
      setLocalSortOrder(localSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setLocalSortBy(field);
      setLocalSortOrder('desc');
    }
  };

  const filteredComplaints = complaints.filter(complaint => {
    if (filters.status && complaint.status !== filters.status) return false;
    if (filters.priority && complaint.priority !== filters.priority) return false;
    if (filters.category && complaint.category !== filters.category) return false;
    if (filters.department && complaint.target_department_names && complaint.target_department_names.length > 0) {
      if (!complaint.target_department_names.some(dept => dept.toLowerCase().includes(filters.department.toLowerCase()))) return false;
    }
    if (filters.dateFrom) {
      const complaintDate = new Date(complaint.created_at);
      const fromDate = new Date(filters.dateFrom);
      if (complaintDate < fromDate) return false;
    }
    if (filters.dateTo) {
      const complaintDate = new Date(complaint.created_at);
      const toDate = new Date(filters.dateTo);
      // Set to end of day for inclusive comparison
      toDate.setHours(23, 59, 59, 999);
      if (complaintDate > toDate) return false;
    }
    return true;
  });

  const sortedComplaints = [...filteredComplaints].sort((a, b) => {
    let aValue: number, bValue: number;

    switch (localSortBy) {
      case 'created_at':
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
        break;
      case 'priority':
        const priorityOrder = { low: 1, medium: 2, high: 3, urgent: 4 };
        aValue = priorityOrder[a.priority] || 0;
        bValue = priorityOrder[b.priority] || 0;
        break;
      case 'status':
        const statusOrder = { pending: 1, in_progress: 2, resolved: 3, closed: 4, rejected: 5 };
        aValue = statusOrder[a.status] || 0;
        bValue = statusOrder[b.status] || 0;
        break;
      default:
        aValue = 0;
        bValue = 0;
    }

    if (localSortOrder === 'asc') {
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

  const handleFilterChange = (filterType: 'status' | 'priority' | 'department' | 'category' | 'dateFrom' | 'dateTo', value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Filters */}
      {showFilters && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
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
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
              <input
                type="text"
                placeholder="Filter by department..."
                value={filters.department}
                onChange={(e) => handleFilterChange('department', e.target.value)}
                className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#359d49]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Date From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#359d49]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#359d49]"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => setFilters({ status: '', priority: '', department: '', category: '', dateFrom: '', dateTo: '' })}
                className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 text-sm"
              >
                Clear Filters
              </Button>
            </div>
          </div>
          
          {/* Quick Date Filters */}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs font-medium text-gray-700 mr-2">Quick Filters:</span>
            <Button
              onClick={() => {
                const today = new Date();
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                setFilters(prev => ({
                  ...prev,
                  dateFrom: yesterday.toISOString().split('T')[0],
                  dateTo: today.toISOString().split('T')[0]
                }));
              }}
              className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1"
            >
              Last 24 Hours
            </Button>
            <Button
              onClick={() => {
                const today = new Date();
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                setFilters(prev => ({
                  ...prev,
                  dateFrom: weekAgo.toISOString().split('T')[0],
                  dateTo: today.toISOString().split('T')[0]
                }));
              }}
              className="text-xs bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1"
            >
              Last 7 Days
            </Button>
            <Button
              onClick={() => {
                const today = new Date();
                const monthAgo = new Date(today);
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                setFilters(prev => ({
                  ...prev,
                  dateFrom: monthAgo.toISOString().split('T')[0],
                  dateTo: today.toISOString().split('T')[0]
                }));
              }}
              className="text-xs bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 py-1"
            >
              Last 30 Days
            </Button>
            <Button
              onClick={() => {
                setFilters(prev => ({
                  ...prev,
                  dateFrom: '',
                  dateTo: ''
                }));
              }}
              className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1"
            >
              Clear Dates
            </Button>
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
                  {localSortBy === 'created_at' && (
                    <span className="ml-1">{localSortOrder === 'asc' ? '↑' : '↓'}</span>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('priority')}>
                <div className="flex items-center">
                  Priority
                  {localSortBy === 'priority' && (
                    <span className="ml-1">{localSortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('status')}>
                <div className="flex items-center">
                  Status
                  {localSortBy === 'status' && (
                    <span className="ml-1">{localSortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedComplaints.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
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
                      {complaint.response && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          💬 Has Response
                        </span>
                      )}
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
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {complaint.target_department_names.slice(0, 3).map((deptName, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${complaint.target_department_colors?.[index] || '#359d49'}20`,
                              color: complaint.target_department_colors?.[index] || '#359d49',
                              border: `1px solid ${complaint.target_department_colors?.[index] || '#359d49'}40`
                            }}
                          >
                            {deptName}
                          </span>
                        ))}
                        {complaint.target_department_names.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                            +{complaint.target_department_names.length - 3} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">All Departments</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      STATUS_CONFIG[complaint.status]?.bgColor || 'bg-gray-100'
                    } ${
                      STATUS_CONFIG[complaint.status]?.color || 'text-gray-800'
                    }`}>
                      {STATUS_CONFIG[complaint.status]?.icon || '❓'} {STATUS_CONFIG[complaint.status]?.label || complaint.status || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      PRIORITY_CONFIG[complaint.priority]?.bgColor || 'bg-gray-100'
                    } ${
                      PRIORITY_CONFIG[complaint.priority]?.color || 'text-gray-800'
                    }`}>
                      {PRIORITY_CONFIG[complaint.priority]?.label || complaint.priority || 'Unknown'}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <div className="flex justify-center">
                      {onView && (
                        <Button
                          onClick={() => onView(complaint)}
                          className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200"
                        >
                          View
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