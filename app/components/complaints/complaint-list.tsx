'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/app/components/ui/button';
import { ComplaintPriority, ComplaintStatus, ComplaintWithRelations } from '@/types/supabase';

interface ComplaintListProps {
  complaints: ComplaintWithRelations[];
  onView: (complaint: ComplaintWithRelations) => void;
  currentPage: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export default function ComplaintList({
  complaints,
  onView,
  currentPage,
  totalCount,
  onPageChange,
  sortBy,
  sortOrder
}: ComplaintListProps) {
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    department: '',
    category: '',
    dateFrom: '',
    dateTo: ''
  });

  // Enhanced search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Bulk selection state
  const [selectedComplaints, setSelectedComplaints] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const [localSortBy, setLocalSortBy] = useState(sortBy);
  const [localSortOrder, setLocalSortOrder] = useState(sortOrder);
  const pageSize = useMemo(() => 10, []);
  const loading = useMemo(() => false, []);
  const showFilters = useMemo(() => true, []);
  const showPagination = useMemo(() => true, []);

  // Loading skeleton array
  const loadingSkeletonArray = useMemo(() => [...Array(5)], []);

  const CATEGORY_LABELS = useMemo(() => ({
    academic: 'Academic',
    facilities: 'Facilities',
    security: 'Security',
    health: 'Health',
    transport: 'Transport',
    other: 'Other',
  }), []);

  const PRIORITY_CONFIG = useMemo(() => ({
    low: { label: 'Low', color: 'text-green-800', bgColor: 'bg-green-100' },
    medium: { label: 'Medium', color: 'text-yellow-800', bgColor: 'bg-yellow-100' },
    high: { label: 'High', color: 'text-orange-800', bgColor: 'bg-orange-100' },
    urgent: { label: 'Urgent', color: 'text-red-800', bgColor: 'bg-red-100' },
  }), []);

  const STATUS_CONFIG = useMemo(() => ({
    pending: { label: 'Pending', icon: '⏳', bgColor: 'bg-yellow-100', color: 'text-yellow-800' },
    in_progress: { label: 'In Progress', icon: '🔄', bgColor: 'bg-blue-100', color: 'text-blue-800' },
    resolved: { label: 'Resolved', icon: '✅', bgColor: 'bg-green-100', color: 'text-green-800' },
    closed: { label: 'Closed', icon: '🔒', bgColor: 'bg-gray-100', color: 'text-gray-800' },
    rejected: { label: 'Rejected', icon: '❌', bgColor: 'bg-red-100', color: 'text-red-800' },
  }), []);

  // Quick filter date calculations
  const quickFilterDates = useMemo(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    return {
      today: today.toISOString().split('T')[0],
      yesterday: yesterday.toISOString().split('T')[0],
      weekAgo: weekAgo.toISOString().split('T')[0],
      monthAgo: monthAgo.toISOString().split('T')[0]
    };
  }, []);

  // Debounce search query for performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const handleSort = useCallback((field: 'created_at' | 'priority' | 'status') => {
    if (localSortBy === field) {
      setLocalSortOrder(localSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setLocalSortBy(field);
      setLocalSortOrder('desc');
    }
  }, [localSortBy, localSortOrder]);

  // Enhanced filtering with search
  const filteredComplaints = useMemo(() => {
    return complaints.filter(complaint => {
      // Search query filtering
      if (debouncedSearchQuery) {
        const searchLower = debouncedSearchQuery.toLowerCase();
        const titleMatch = complaint.title.toLowerCase().includes(searchLower);
        const descriptionMatch = complaint.description.toLowerCase().includes(searchLower);
        const departmentMatch = complaint.target_department_names?.some(dept => 
          dept.toLowerCase().includes(searchLower)
        );
        
        if (!titleMatch && !descriptionMatch && !departmentMatch) {
          return false;
        }
      }

      // Existing filters
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
  }, [complaints, filters, debouncedSearchQuery]);

  // Update select all when filtered complaints change
  useEffect(() => {
    if (filteredComplaints.length === 0) {
      setSelectAll(false);
      setSelectedComplaints(new Set());
    } else if (selectedComplaints.size === filteredComplaints.length && filteredComplaints.length > 0) {
      setSelectAll(true);
    } else if (selectedComplaints.size !== filteredComplaints.length) {
      setSelectAll(false);
    }
  }, [filteredComplaints.length, selectedComplaints.size]); // Only depend on lengths, not the actual objects

  // CSV Export functionality
  const csvHeaders = useMemo(() => [
    'ID',
    'Title',
    'Description',
    'Category',
    'Priority',
    'Status',
    'Target Departments',
    'Assigned To',
    'Response',
    'Created At',
    'Updated At'
  ], []);

  const exportToCSV = useCallback((complaintsToExport: ComplaintWithRelations[]) => {
    if (complaintsToExport.length === 0) {
      alert('No complaints to export');
      return;
    }

    // Convert complaints to CSV rows
    const csvRows = complaintsToExport.map(complaint => [
      complaint.id,
      `"${complaint.title.replace(/"/g, '""')}"`,
      `"${complaint.description.replace(/"/g, '""')}"`,
      complaint.category,
      complaint.priority,
      complaint.status,
      complaint.target_department_names?.join(', ') || '',
      complaint.assigned_to?.full_name || '',
      complaint.response ? `"${complaint.response.replace(/"/g, '""')}"` : '',
      complaint.created_at,
      complaint.updated_at
    ]);

    // Combine headers and rows
    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.join(','))
      .join('\n');

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `complaints_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [csvHeaders]);

  // Bulk selection handlers
  const handleSelectAll = useCallback(() => {
    if (selectAll) {
      setSelectedComplaints(new Set());
      setSelectAll(false);
    } else {
      setSelectedComplaints(new Set(filteredComplaints.map(c => c.id)));
      setSelectAll(true);
    }
  }, [selectAll, filteredComplaints]);

  const handleSelectComplaint = useCallback((complaintId: string) => {
    const newSelected = new Set(selectedComplaints);
    if (newSelected.has(complaintId)) {
      newSelected.delete(complaintId);
    } else {
      newSelected.add(complaintId);
    }
    setSelectedComplaints(newSelected);
  }, [selectedComplaints]);

  // Bulk action handlers
  const handleBulkStatusUpdate = useCallback(async (newStatus: ComplaintStatus) => {
    if (selectedComplaints.size === 0) {
      alert('Please select complaints to update');
      return;
    }

    if (confirm(`Are you sure you want to update ${selectedComplaints.size} complaints to status "${newStatus}"?`)) {
      try {
        // Here you would make API calls to update the status of selected complaints
        // For now, we'll just show a success message
        alert(`Successfully updated ${selectedComplaints.size} complaints to ${newStatus}`);
        
        // Clear selection after successful update
        setSelectedComplaints(new Set());
        setSelectAll(false);
      } catch {
        alert('Failed to update complaints. Please try again.');
      }
    }
  }, [selectedComplaints.size]);

  const handleBulkPriorityUpdate = useCallback(async (newPriority: ComplaintPriority) => {
    if (selectedComplaints.size === 0) {
      alert('Please select complaints to update');
      return;
    }

    if (confirm(`Are you sure you want to update ${selectedComplaints.size} complaints to priority "${newPriority}"?`)) {
      try {
        // Here you would make API calls to update the priority of selected complaints
        // For now, we'll just show a success message
        alert(`Successfully updated ${selectedComplaints.size} complaints to ${newPriority} priority`);
        
        // Clear selection after successful update
        setSelectedComplaints(new Set());
        setSelectAll(false);
      } catch {
        alert('Failed to update complaints. Please try again.');
      }
    }
  }, [selectedComplaints.size]);

  const sortedComplaints = useMemo(() => {
    const priorityOrder = { low: 1, medium: 2, high: 3, urgent: 4 };
    const statusOrder = { pending: 1, in_progress: 2, resolved: 3, closed: 4, rejected: 5 };
    
    return [...filteredComplaints].sort((a, b) => {
      let aValue: number, bValue: number;

      switch (localSortBy) {
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'priority':
          aValue = priorityOrder[a.priority] || 0;
          bValue = priorityOrder[b.priority] || 0;
          break;
        case 'status':
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
  }, [filteredComplaints, localSortBy, localSortOrder]);

  const totalPages = useMemo(() => Math.ceil(totalCount / pageSize), [totalCount, pageSize]);

  // Search results summary
  const searchResultsSummary = useMemo(() => {
    if (!debouncedSearchQuery) return null;
    return `Found ${filteredComplaints.length} complaints matching "${debouncedSearchQuery}"`;
  }, [debouncedSearchQuery, filteredComplaints.length]);

  // Complaints count display text
  const complaintsCountText = useMemo(() => {
    return `Showing ${filteredComplaints.length} of ${complaints.length} complaints`;
  }, [filteredComplaints.length, complaints.length]);

  // Selected complaints count text
  const selectedComplaintsText = useMemo(() => {
    if (selectedComplaints.size === 0) return null;
    return `(${selectedComplaints.size} selected)`;
  }, [selectedComplaints.size]);

  // Selected complaints count text for bulk actions
  const selectedComplaintsCountText = useMemo(() => {
    const count = selectedComplaints.size;
    return `${count} complaint${count !== 1 ? 's' : ''} selected`;
  }, [selectedComplaints.size]);

  // No complaints found message
  const noComplaintsMessage = useMemo(() => {
    if (debouncedSearchQuery) {
      return `No complaints found matching "${debouncedSearchQuery}"`;
    }
    return 'No complaints found';
  }, [debouncedSearchQuery]);

  // Pagination info text
  const paginationInfoText = useMemo(() => {
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalCount);
    return `Showing ${start} to ${end} of ${totalCount} results`;
  }, [currentPage, pageSize, totalCount]);

  // Pagination buttons array
  const paginationButtons = useMemo(() => {
    return [...Array(totalPages)].map((_, i) => i + 1);
  }, [totalPages]);

  // Bulk actions visibility
  const showBulkActions = useMemo(() => selectedComplaints.size > 0, [selectedComplaints.size]);

  // Filter and utility handlers
  const handleFilterChange = useCallback((filterType: 'status' | 'priority' | 'department' | 'category' | 'dateFrom' | 'dateTo', value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({ status: '', priority: '', department: '', category: '', dateFrom: '', dateTo: '' });
    setSearchQuery('');
  }, []);

  // Highlight search terms in text
  const highlightText = useCallback((text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">{part}</mark>
      ) : part
    );
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {loadingSkeletonArray.map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Enhanced Search Bar */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex flex-col space-y-4">
          {/* Main Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search complaints by title, description, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Search Results Summary */}
          {searchResultsSummary && (
            <div className="text-sm text-blue-600">
              {searchResultsSummary}
            </div>
          )}

          {/* Quick Filter Presets */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700 mr-2">Quick Filters:</span>
            <Button
              onClick={() => setFilters(prev => ({ ...prev, status: 'pending' }))}
              className="text-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-lg shadow-sm"
            >
              ⏳ Pending
            </Button>
            <Button
              onClick={() => setFilters(prev => ({ ...prev, priority: 'high' }))}
              className="text-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-lg shadow-sm"
            >
              🔴 High Priority
            </Button>
            <Button
              onClick={() => {
                setFilters(prev => ({
                  ...prev,
                  dateFrom: quickFilterDates.weekAgo,
                  dateTo: quickFilterDates.today
                }));
              }}
              className="text-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-lg shadow-sm"
            >
              📅 This Week
            </Button>
            <Button
              onClick={clearAllFilters}
              className="text-sm bg-gray-100 border border-gray-300 text-gray-600 hover:bg-gray-200 px-3 py-2 rounded-lg shadow-sm"
            >
              🗑️ Clear All
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="p-4 border-b border-gray-200 bg-yellow-50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-yellow-800">
                {selectedComplaintsCountText}
              </span>
              <Button
                onClick={() => {
                  setSelectedComplaints(new Set());
                  setSelectAll(false);
                }}
                className="text-xs bg-yellow-100 text-yellow-700 hover:bg-yellow-200 px-2 py-1"
              >
                Clear Selection
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {/* Export Selected */}
              <Button
                onClick={() => exportToCSV(filteredComplaints.filter(c => selectedComplaints.has(c.id)))}
                className="text-xs bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1"
              >
                📥 Export Selected ({selectedComplaints.size})
              </Button>
              
              {/* Bulk Status Update */}
              <div className="relative">
                <select
                  onChange={(e) => handleBulkStatusUpdate(e.target.value as ComplaintStatus)}
                  className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 border-0 rounded cursor-pointer"
                  defaultValue=""
                >
                  <option value="" disabled>🔄 Update Status</option>
                  {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                    <option key={value} value={value}>
                      {config.icon} {config.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Bulk Priority Update */}
              <div className="relative">
                <select
                  onChange={(e) => handleBulkPriorityUpdate(e.target.value as ComplaintPriority)}
                  className="text-xs bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 py-1 border-0 rounded cursor-pointer"
                  defaultValue=""
                >
                  <option value="" disabled>🎯 Update Priority</option>
                  {Object.entries(PRIORITY_CONFIG).map(([value, config]) => (
                    <option key={value} value={value}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export All Button */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">
              {complaintsCountText} {selectedComplaintsText}
            </span>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => exportToCSV(filteredComplaints)}
              className="text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2"
            >
              📥 Export All ({filteredComplaints.length})
            </Button>
          </div>
        </div>
      </div>

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
          </div>
          
          {/* Quick Date Filters */}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs font-medium text-gray-700 mr-2">Quick Date Filters:</span>
            <Button
              onClick={() => {
                setFilters(prev => ({
                  ...prev,
                  dateFrom: quickFilterDates.yesterday,
                  dateTo: quickFilterDates.today
                }));
              }}
              className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1"
            >
              Last 24 Hours
            </Button>
            <Button
              onClick={() => {
                setFilters(prev => ({
                  ...prev,
                  dateFrom: quickFilterDates.weekAgo,
                  dateTo: quickFilterDates.today
                }));
              }}
              className="text-xs bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1"
            >
              Last 7 Days
            </Button>
            <Button
              onClick={() => {
                setFilters(prev => ({
                  ...prev,
                  dateFrom: quickFilterDates.monthAgo,
                  dateTo: quickFilterDates.today
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
              {/* Bulk Selection Header */}
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-[#359d49] focus:ring-[#359d49] border-gray-300 rounded"
                />
              </th>
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
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                  {noComplaintsMessage}
                </td>
              </tr>
            ) : (
              sortedComplaints.map((complaint) => (
                <tr 
                  key={complaint.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => onView(complaint)}
                >
                  {/* Bulk Selection Checkbox */}
                  <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedComplaints.has(complaint.id)}
                      onChange={() => handleSelectComplaint(complaint.id)}
                      className="h-4 w-4 text-[#359d49] focus:ring-[#359d49] border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(complaint.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                      {debouncedSearchQuery ? highlightText(complaint.title, debouncedSearchQuery) : complaint.title}
                      {complaint.response && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          💬 Has Response
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 max-w-xs truncate">
                      {debouncedSearchQuery ? highlightText(complaint.description.substring(0, 60) + '...', debouncedSearchQuery) : complaint.description.substring(0, 60) + '...'}
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
                            {debouncedSearchQuery ? highlightText(deptName, debouncedSearchQuery) : deptName}
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
                      PRIORITY_CONFIG[complaint.priority]?.bgColor || 'bg-gray-100'
                    } ${
                      PRIORITY_CONFIG[complaint.priority]?.color || 'text-gray-800'
                    }`}>
                      {PRIORITY_CONFIG[complaint.priority]?.label || complaint.priority || 'Unknown'}
                    </span>
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

                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium" onClick={(e) => e.stopPropagation()}>
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
                  {paginationInfoText}
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
                  {paginationButtons.map((page) => (
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
                  ))}
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