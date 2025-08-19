'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/app/components/ui/button';
import { Report } from '@/types/supabase';

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
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

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

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

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
        throw new Error('Failed to delete report');
      }

      // Remove from local state
      setReports(prev => prev.filter(r => r.id !== reportId));
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete report');
    }
  };

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
    return months[month - 1] || '';
  };

  const getVisibilityBadge = (visibility: string[]) => {
    if (visibility.includes('src') && visibility.includes('student')) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">All Dashboards</span>;
    } else if (visibility.includes('src')) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">SRC Only</span>;
    } else if (visibility.includes('student')) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Student Only</span>;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchReports} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Upload Button */}
      {showUploadButton && onUploadClick && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
            <p className="text-gray-600">Manage and view monthly reports</p>
          </div>
          <Button
            onClick={onUploadClick}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Upload New Report
          </Button>
        </div>
      )}

      {/* Reports List */}
      {reports.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
          <p className="text-gray-600">
            {showUploadButton 
              ? 'Get started by uploading your first report.' 
              : 'No reports are currently available for your role.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                {/* Report Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {report.title}
                    </h3>
                    {getVisibilityBadge(report.visibility)}
                  </div>
                  
                  {report.description && (
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {report.description}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <span className="mr-1">📅</span>
                      {getMonthName(report.month)} {report.year}
                    </span>
                    <span className="flex items-center">
                      <span className="mr-1">📊</span>
                      {report.download_count || 0} downloads
                    </span>
                    {report.file_size && (
                      <span className="flex items-center">
                        <span className="mr-1">💾</span>
                        {formatFileSize(report.file_size)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Button
                    onClick={() => handleDownload(report.id)}
                    disabled={downloading === report.id}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    {downloading === report.id ? (
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Downloading...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <span className="mr-1">⬇️</span>
                        Download
                      </span>
                    )}
                  </Button>
                  
                  {/* Delete button - only for admin and SRC president */}
                  {(userRole === 'admin' || (userRole === 'src' && report.uploaded_by === 'President')) && (
                    <Button
                      onClick={() => handleDelete(report.id)}
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                      size="sm"
                    >
                      <span className="mr-1">🗑️</span>
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
  );
}
