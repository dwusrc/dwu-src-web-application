'use client';

interface PerformanceChartsProps {
  data: {
    complaintsByStatus: Record<string, number>;
    complaintsByPriority: Record<string, number>;
    recentTrends: {
      last7Days: number;
      last30Days: number;
      last90Days: number;
    };
  };
}

export default function PerformanceCharts({ data }: PerformanceChartsProps) {
  const { complaintsByStatus, complaintsByPriority, recentTrends } = data;

  // Calculate percentages for status
  const totalStatus = Object.values(complaintsByStatus).reduce((a, b) => a + b, 0);
  const statusPercentages = Object.entries(complaintsByStatus).map(([status, count]) => ({
    status,
    count,
    percentage: totalStatus > 0 ? (count / totalStatus) * 100 : 0
  }));

  // Calculate percentages for priority
  const totalPriority = Object.values(complaintsByPriority).reduce((a, b) => a + b, 0);
  const priorityPercentages = Object.entries(complaintsByPriority).map(([priority, count]) => ({
    priority,
    count,
    percentage: totalPriority > 0 ? (count / totalPriority) * 100 : 0
  }));

  // Color schemes
  const statusColors = {
    pending: '#f59e0b',
    in_progress: '#3b82f6',
    resolved: '#10b981',
    closed: '#6b7280',
    rejected: '#ef4444'
  };

  const priorityColors = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#f97316',
    urgent: '#ef4444'
  };

  return (
    <div className="space-y-6">
      {/* Charts Section Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">📈 Performance Analytics</h2>
        <p className="text-gray-600 mt-2">Visual breakdown of complaint distribution and trends</p>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Status Distribution Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Complaints by Status</h3>
          <div className="space-y-4">
            {statusPercentages.map(({ status, count, percentage }) => (
              <div key={status} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {status.replace('_', ' ')}
                  </span>
                  <span className="text-sm text-gray-600">
                    {count} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: statusColors[status as keyof typeof statusColors] || '#6b7280'
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Distribution Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Complaints by Priority</h3>
          <div className="space-y-4">
            {priorityPercentages.map(({ priority, count, percentage }) => (
              <div key={priority} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {priority}
                  </span>
                  <span className="text-sm text-gray-600">
                    {count} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: priorityColors[priority as keyof typeof priorityColors] || '#6b7280'
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Trends Chart */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">📅 Recent Trends</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Last 7 Days */}
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">{recentTrends.last7Days}</div>
            <div className="text-sm font-medium text-gray-700">Last 7 Days</div>
            <div className="text-xs text-gray-500 mt-1">Weekly activity</div>
          </div>

          {/* Last 30 Days */}
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600">{recentTrends.last30Days}</div>
            <div className="text-sm font-medium text-gray-700">Last 30 Days</div>
            <div className="text-xs text-gray-500 mt-1">Monthly activity</div>
          </div>

          {/* Last 90 Days */}
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-3xl font-bold text-purple-600">{recentTrends.last90Days}</div>
            <div className="text-sm font-medium text-gray-700">Last 90 Days</div>
            <div className="text-xs text-gray-500 mt-1">Quarterly activity</div>
          </div>
        </div>

        {/* Trend Analysis */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">📊 Trend Analysis</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Weekly to Monthly:</span>
              <span className={`ml-2 font-medium ${
                recentTrends.last30Days > recentTrends.last7Days * 4 ? 'text-green-600' : 'text-red-600'
              }`}>
                {recentTrends.last30Days > recentTrends.last7Days * 4 ? '↗️ Increasing' : '↘️ Decreasing'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Monthly to Quarterly:</span>
              <span className={`ml-2 font-medium ${
                recentTrends.last90Days > recentTrends.last30Days * 3 ? 'text-green-600' : 'text-red-600'
              }`}>
                {recentTrends.last90Days > recentTrends.last30Days * 3 ? '↗️ Consistent' : '↘️ Declining'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
