'use client';

import { Button } from '@/app/components/ui/button';

interface AnalyticsOverviewProps {
  data: {
    overview: {
      totalComplaints: number;
      pendingComplaints: number;
      resolvedComplaints: number;
      avgResponseTime: number;
      resolutionRate: string;
      avgResponseTime24h: string;
    };
  };
  onRefresh: () => void;
  onExport: () => void;
}

export default function AnalyticsOverview({ data, onRefresh, onExport }: AnalyticsOverviewProps) {
  const { overview } = data;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📊 Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Comprehensive complaint analytics and performance metrics</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onRefresh}
            className="bg-[#359d49] hover:bg-[#2a6b39] text-white"
          >
            🔄 Refresh Data
          </Button>
          <Button
            onClick={onExport}
            variant="outline"
            className="border-[#359d49] text-[#359d49] hover:bg-[#359d49] hover:text-white"
          >
            📥 Export Report
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Complaints */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Complaints</p>
              <p className="text-3xl font-bold text-gray-900">{overview.totalComplaints}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <span className="text-2xl">📊</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-gray-600">
              <span className="text-green-500">●</span>
              <span className="ml-2">All time complaints</span>
            </div>
          </div>
        </div>

        {/* Pending Complaints */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-gray-900">{overview.pendingComplaints}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <span className="text-2xl">⚠️</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-gray-600">
              <span className="text-red-500">●</span>
              <span className="ml-2">Requires attention</span>
            </div>
          </div>
        </div>

        {/* Resolution Rate */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Resolution Rate</p>
              <p className="text-3xl font-bold text-gray-900">{overview.resolutionRate}%</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <span className="text-2xl">✅</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-gray-600">
              <span className="text-green-500">●</span>
              <span className="ml-2">Successfully resolved</span>
            </div>
          </div>
        </div>

        {/* Average Response Time */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Response</p>
              <p className="text-3xl font-bold text-gray-900">{overview.avgResponseTime}h</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <span className="text-2xl">⏱️</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-gray-600">
              <span className="text-purple-500">●</span>
              <span className="ml-2">Hours to respond</span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 24h Response Rate */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{overview.avgResponseTime24h}%</div>
            <div className="text-sm text-gray-600">24h Response Rate</div>
            <div className="mt-2 text-xs text-gray-500">Complaints handled within 24 hours</div>
          </div>
        </div>

        {/* Resolved Count */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{overview.resolvedComplaints}</div>
            <div className="text-sm text-gray-600">Resolved Complaints</div>
            <div className="mt-2 text-xs text-gray-500">Successfully closed cases</div>
          </div>
        </div>

        {/* Efficiency Score */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round((parseFloat(overview.resolutionRate) / 100) * (100 - overview.avgResponseTime))}%
            </div>
            <div className="text-sm text-gray-600">Efficiency Score</div>
            <div className="mt-2 text-xs text-gray-500">Resolution rate × Speed factor</div>
          </div>
        </div>
      </div>
    </div>
  );
}
