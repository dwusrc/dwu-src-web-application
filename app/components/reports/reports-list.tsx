'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/app/components/ui/button';
import { Report, ReportCategory } from '@/types/supabase';

// Enhanced Report type with category information
interface ReportWithCategory extends Report {
  category?: {
    id: string;
    name: string;
    color: string;
    description?: string;
  };
  uploaded_by_user?: {
    id: string;
    full_name: string;
    role: string;
    src_department?: string;
  };
}

interface ReportsListProps {
  userRole: 'student' | 'src' | 'admin';
  showUploadButton?: boolean;
  onUploadClick?: () => void;
}

export default function ReportsList({ 
  userRole, 
  showUploadButton = false, 
  onUploadClick 
}: ReportsListProps) {
  const [reports, setReports] = useState<ReportWithCategory[]>([]);
  const [categories, setCategories] = useState<ReportCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    visibility: '',
    dateFrom: '',
    dateTo: '',
    month: '',
    year: ''
  });
  
  // Sort states
  const [sortBy, setSortBy] = useState<'created_at' | 'title' | 'month' | 'year'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/reports');
      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }
      
      const data = await response.json();
      setReports(data.reports || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/reports/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  }, []);

  useEffect(() => {
    fetchReports();
    fetchCategories();
  }, [fetchReports, fetchCategories]);

  // Debounce search query for performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleDownload = async (reportId: string) => {
    try {
      setDownloading(reportId);
      
      const response = await fetch(`/api/reports/${reportId}/download`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Download failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.file_url) {
        throw new Error('Invalid download response');
      }
      
      // Create download link
      const link = document.createElement('a');
      link.href = data.file_url;
      link.download = data.file_name;
      link.target = '_blank'; // Open in new tab for better UX
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show success message
      setError(null); // Clear any previous errors
      
      // Refresh reports to get updated download count
      fetchReports();
    } catch (err) {
      console.error('Download error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to download report';
      setError(`Download failed: ${errorMessage}`);
    } finally {
      setDownloading(null);
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete report');
      }

      // Remove from local state
      setReports(prev => prev.filter(r => r.id !== reportId));
      setError(null);
    } catch (err) {
      console.error('Delete error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete report';
      setError(`Delete failed: ${errorMessage}`);
    }
  };

  // Enhanced filtering with search
  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      // Search query filtering
      if (debouncedSearchQuery) {
        const searchLower = debouncedSearchQuery.toLowerCase();
        const titleMatch = report.title.toLowerCase().includes(searchLower);
        const descriptionMatch = report.description?.toLowerCase().includes(searchLower) || false;
        const fileNameMatch = report.file_name.toLowerCase().includes(searchLower);
        const categoryMatch = report.category?.name.toLowerCase().includes(searchLower) || false;
        const uploaderMatch = report.uploaded_by_user?.full_name.toLowerCase().includes(searchLower) || false;
        
        if (!titleMatch && !descriptionMatch && !fileNameMatch && !categoryMatch && !uploaderMatch) {
          return false;
        }
      }

      // Category filter
      if (filters.category && report.category?.id !== filters.category) return false;
      
      // Visibility filter
      if (filters.visibility && report.visibility && !report.visibility.includes(filters.visibility)) return false;
      
      // Month filter
      if (filters.month && report.month !== parseInt(filters.month)) return false;
      
      // Year filter
      if (filters.year && report.year !== parseInt(filters.year)) return false;
      
      // Date range filters
      if (filters.dateFrom) {
        const reportDate = new Date(report.created_at);
        const fromDate = new Date(filters.dateFrom);
        if (reportDate < fromDate) return false;
      }
      if (filters.dateTo) {
        const reportDate = new Date(report.created_at);
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (reportDate > toDate) return false;
      }
      
      return true;
    });
  }, [reports, filters, debouncedSearchQuery]);

  // Sort filtered reports
  const sortedReports = useMemo(() => {
    return [...filteredReports].sort((a, b) => {
      let aValue: string | number | Date, bValue: string | number | Date;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'month':
          aValue = a.month;
          bValue = b.month;
          break;
        case 'year':
          aValue = a.year;
          bValue = b.year;
          break;
        case 'created_at':
        default:
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [filteredReports, sortBy, sortOrder]);

  const handleSort = useCallback((field: 'created_at' | 'title' | 'month' | 'year') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  }, [sortBy, sortOrder]);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setFilters({
      category: '',
      visibility: '',
      dateFrom: '',
      dateTo: '',
      month: '',
      year: ''
    });
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getMonthName = (month: number): string => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Upload Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
          <p className="text-gray-600">View and manage monthly reports</p>
        </div>
        {showUploadButton && (
          <Button
            onClick={onUploadClick}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            📄 Upload Report
          </Button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Filters Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters & Search</h3>
        
        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search reports by title, description, filename, category, or uploader..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Visibility Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
            <select
              value={filters.visibility}
              onChange={(e) => setFilters(prev => ({ ...prev, visibility: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Visibility</option>
              <option value="src">SRC Only</option>
              <option value="student">Student Only</option>
              <option value="admin">Admin Only</option>
            </select>
          </div>

          {/* Month Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
            <select
              value={filters.month}
              onChange={(e) => setFilters(prev => ({ ...prev, month: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Months</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <option key={month} value={month}>
                  {getMonthName(month)}
                </option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
            <select
              value={filters.year}
              onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Years</option>
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Filter Actions */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {debouncedSearchQuery 
              ? `Found ${filteredReports.length} reports matching "${debouncedSearchQuery}"`
              : `Showing ${filteredReports.length} of ${reports.length} reports`
            }
          </div>
          <Button
            onClick={clearFilters}
            variant="outline"
            className="text-gray-600 hover:text-gray-800"
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Reports</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Sort by:</span>
              <button
                onClick={() => handleSort('title')}
                className={`px-2 py-1 rounded ${
                  sortBy === 'title' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                }`}
              >
                Title
              </button>
              <button
                onClick={() => handleSort('created_at')}
                className={`px-2 py-1 rounded ${
                  sortBy === 'created_at' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                }`}
              >
                Date
              </button>
              <button
                onClick={() => handleSort('month')}
                className={`px-2 py-1 rounded ${
                  sortBy === 'month' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => handleSort('year')}
                className={`px-2 py-1 rounded ${
                  sortBy === 'year' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                }`}
              >
                Year
              </button>
            </div>
          </div>
        </div>

        {sortedReports.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📄</div>
            <p className="text-gray-600">
              {filteredReports.length === 0 && reports.length > 0 
                ? 'No reports match your current filters. Try adjusting your search criteria.'
                : 'No reports found. Upload your first report to get started.'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sortedReports.map((report) => (
              <div key={report.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-medium text-gray-900">{report.title}</h4>
                      {report.category && (
                        <span
                          className="px-2 py-1 text-xs font-medium rounded-full text-white"
                          style={{ backgroundColor: report.category.color }}
                        >
                          {report.category.name}
                        </span>
                      )}
                    </div>
                    
                    {report.description && (
                      <p className="text-gray-600 mb-3">{report.description}</p>
                    )}
                    
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <span>📅 {getMonthName(report.month)} {report.year}</span>
                      <span>📁 {report.file_name}</span>
                                             <span>💾 {report.file_size ? formatFileSize(report.file_size) : 'Unknown size'}</span>
                      <span>⬇️ {report.download_count || 0} downloads</span>
                      {report.uploaded_by_user && (
                        <span>👤 {report.uploaded_by_user.full_name}</span>
                      )}
                      <div className="flex gap-1">
                        {report.visibility?.map(vis => (
                          <span
                            key={vis}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                          >
                            {vis}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      onClick={() => handleDownload(report.id)}
                      disabled={downloading === report.id}
                      variant="outline"
                      size="sm"
                      className="border-blue-300 text-blue-600 hover:bg-blue-50"
                    >
                      {downloading === report.id ? 'Downloading...' : 'Download'}
                    </Button>
                    
                    {(userRole === 'admin' || (userRole === 'src' && report.uploaded_by_user?.src_department === 'President')) && (
                      <Button
                        onClick={() => handleDelete(report.id)}
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
