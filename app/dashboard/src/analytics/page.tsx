'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/app/components/auth/protected-route';
import { PageLayout } from '@/app/components/layout/page-layout';
import { Button } from '@/app/components/ui/button';
import AnalyticsOverview from '@/app/components/analytics/analytics-overview';
import PerformanceCharts from '@/app/components/analytics/performance-charts';
import DepartmentPerformance from '@/app/components/analytics/department-performance';

// Analytics data types
interface AnalyticsData {
  overview: {
    totalComplaints: number;
    pendingComplaints: number;
    resolvedComplaints: number;
    avgResponseTime: number;
    resolutionRate: string;
    avgResponseTime24h: string;
  };
  complaintsByStatus: Record<string, number>;
  complaintsByPriority: Record<string, number>;
  complaintsByDepartment: Record<string, {
    count: number;
    resolvedCount: number;
    resolutionRate: string;
    color: string;
  }>;
  recentTrends: {
    last7Days: number;
    last30Days: number;
    last90Days: number;
  };
  performanceMetrics: {
    topPerformingDepartment: string;
    highestResolutionRate: string;
    fastestResponseTime: string;
  };
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Fetching analytics data...');
      
      const response = await fetch('/api/analytics/overview');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAnalyticsData(data.data);
          setLastUpdated(new Date());
          console.log('✅ Analytics data loaded successfully:', data.data);
        } else {
          setError(data.error || 'Failed to load analytics data');
          console.error('❌ Analytics API returned error:', data.error);
        }
      } else {
        setError(`Failed to fetch analytics: ${response.status}`);
        console.error('❌ Failed to fetch analytics:', response.status);
      }
    } catch (error) {
      setError('Error fetching analytics data');
      console.error('❌ Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Export analytics data as CSV
  const exportAnalyticsData = () => {
    if (!analyticsData) return;

    try {
      // Create CSV content
      let csvContent = 'data:text/csv;charset=utf-8,';
      
      // Overview section
      csvContent += 'Analytics Overview\n';
      csvContent += 'Metric,Value\n';
      csvContent += `Total Complaints,${analyticsData.overview.totalComplaints}\n`;
      csvContent += `Pending Complaints,${analyticsData.overview.pendingComplaints}\n`;
      csvContent += `Resolved Complaints,${analyticsData.overview.resolvedComplaints}\n`;
      csvContent += `Resolution Rate,${analyticsData.overview.resolutionRate}%\n`;
      csvContent += `Average Response Time,${analyticsData.overview.avgResponseTime}h\n`;
      csvContent += `24h Response Rate,${analyticsData.overview.avgResponseTime24h}%\n\n`;
      
      // Department performance
      csvContent += 'Department Performance\n';
      csvContent += 'Department,Total Complaints,Resolved,Resolution Rate\n';
      Object.entries(analyticsData.complaintsByDepartment).forEach(([dept, data]) => {
        csvContent += `${dept},${data.count},${data.resolvedCount},${data.resolutionRate}%\n`;
      });
      csvContent += '\n';
      
      // Recent trends
      csvContent += 'Recent Trends\n';
      csvContent += 'Period,Complaint Count\n';
      csvContent += `Last 7 Days,${analyticsData.recentTrends.last7Days}\n`;
      csvContent += `Last 30 Days,${analyticsData.recentTrends.last30Days}\n`;
      csvContent += `Last 90 Days,${analyticsData.recentTrends.last90Days}\n\n`;
      
      // Performance metrics
      csvContent += 'Performance Metrics\n';
      csvContent += 'Metric,Value\n';
      csvContent += `Top Performing Department,${analyticsData.performanceMetrics.topPerformingDepartment}\n`;
      csvContent += `Highest Resolution Rate,${analyticsData.performanceMetrics.highestResolutionRate}%\n`;
      csvContent += `Fastest Response Time,${analyticsData.performanceMetrics.fastestResponseTime}h\n`;
      
      // Create download link
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `analytics-report-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ Analytics data exported successfully');
    } catch (error) {
      console.error('❌ Error exporting analytics data:', error);
      alert('Failed to export analytics data');
    }
  };

  // Auto-refresh every 5 minutes
  useEffect(() => {
    fetchAnalyticsData();
    
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing analytics data...');
      fetchAnalyticsData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  // Loading state
  if (loading && !analyticsData) {
    return (
      <ProtectedRoute requiredRole="src">
        <PageLayout>
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="text-center py-16">
              <div className="text-6xl mb-6">📊</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Loading Analytics Dashboard</h1>
              <p className="text-gray-600 mb-8">Fetching comprehensive complaint analytics...</p>
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-800 mr-2"></div>
                Loading...
              </div>
            </div>
          </div>
        </PageLayout>
      </ProtectedRoute>
    );
  }

  // Error state
  if (error) {
    return (
      <ProtectedRoute requiredRole="src">
        <PageLayout>
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="text-center py-16">
              <div className="text-6xl mb-6">❌</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Analytics Loading Error</h1>
              <p className="text-gray-600 mb-8">{error}</p>
              <div className="space-x-4">
                <Button
                  onClick={fetchAnalyticsData}
                  className="bg-[#359d49] hover:bg-[#2a6b39] text-white"
                >
                  🔄 Retry
                </Button>
                <Button
                  onClick={() => window.history.back()}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  ← Back to Dashboard
                </Button>
              </div>
            </div>
          </div>
        </PageLayout>
      </ProtectedRoute>
    );
  }

  // Main analytics content
  return (
    <ProtectedRoute requiredRole="src">
      <PageLayout>
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Back to Dashboard Button */}
          <div className="mb-6">
            <Button
              onClick={() => window.history.back()}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              ← Back to Dashboard
            </Button>
          </div>

          {/* Last Updated Indicator */}
          {lastUpdated && (
            <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center text-sm text-blue-700">
                <span className="mr-2">🕒</span>
                <span>Last updated: {lastUpdated.toLocaleString()}</span>
                <span className="ml-2">•</span>
                <span className="ml-2">Auto-refreshes every 5 minutes</span>
              </div>
            </div>
          )}

          {/* Analytics Components */}
          {analyticsData && (
            <div className="space-y-12">
              {/* Overview Section */}
              <AnalyticsOverview
                data={analyticsData}
                onRefresh={fetchAnalyticsData}
                onExport={exportAnalyticsData}
              />

              {/* Performance Charts Section */}
              <PerformanceCharts data={analyticsData} />

              {/* Department Performance Section */}
              <DepartmentPerformance data={analyticsData} />

              {/* Footer Actions */}
              <div className="text-center py-8">
                <div className="space-y-4">
                  <p className="text-gray-600">
                    📊 Comprehensive analytics dashboard for SRC complaint management
                  </p>
                  <div className="flex justify-center space-x-4">
                    <Button
                      onClick={fetchAnalyticsData}
                      className="bg-[#359d49] hover:bg-[#2a6b39] text-white"
                    >
                      🔄 Refresh Data
                    </Button>
                    <Button
                      onClick={exportAnalyticsData}
                      variant="outline"
                      className="border-[#359d49] text-[#359d49] hover:bg-[#359d49] hover:text-white"
                    >
                      📥 Export Report
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
