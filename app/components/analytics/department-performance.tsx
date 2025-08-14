'use client';

interface DepartmentPerformanceProps {
  data: {
    complaintsByDepartment: Record<string, {
      count: number;
      resolvedCount: number;
      resolutionRate: string;
      color: string;
    }>;
    performanceMetrics: {
      topPerformingDepartment: string;
      highestResolutionRate: string;
      fastestResponseTime: string;
    };
  };
}

export default function DepartmentPerformance({ data }: DepartmentPerformanceProps) {
  const { complaintsByDepartment, performanceMetrics } = data;

  // Sort departments by performance (resolution rate)
  const sortedDepartments = Object.entries(complaintsByDepartment).sort(([, a], [, b]) => {
    return parseFloat(b.resolutionRate) - parseFloat(a.resolutionRate);
  });

  // Calculate overall performance metrics
  const totalDepartments = Object.keys(complaintsByDepartment).length;
  const avgResolutionRate = Object.values(complaintsByDepartment).reduce((sum, dept) => 
    sum + parseFloat(dept.resolutionRate), 0) / totalDepartments;

  return (
    <div className="space-y-6">
      {/* Department Performance Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">🏢 Department Performance</h2>
        <p className="text-gray-600 mt-2">Comprehensive analysis of SRC department effectiveness</p>
      </div>

      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Top Performing Department */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Top Department</p>
              <p className="text-xl font-bold text-gray-900">{performanceMetrics.topPerformingDepartment}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <span className="text-2xl">🏆</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm text-gray-600">
              Best resolution rate: <span className="font-semibold text-green-600">{performanceMetrics.highestResolutionRate}%</span>
            </div>
          </div>
        </div>

        {/* Average Performance */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Performance</p>
              <p className="text-xl font-bold text-gray-900">{avgResolutionRate.toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <span className="text-2xl">📊</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm text-gray-600">
              Across <span className="font-semibold text-blue-600">{totalDepartments}</span> departments
            </div>
          </div>
        </div>

        {/* Performance Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Performance Range</p>
              <p className="text-xl font-bold text-gray-900">
                {Math.min(...Object.values(complaintsByDepartment).map(d => parseFloat(d.resolutionRate))).toFixed(1)}% - {Math.max(...Object.values(complaintsByDepartment).map(d => parseFloat(d.resolutionRate))).toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <span className="text-2xl">📈</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm text-gray-600">
              Min to max resolution rates
            </div>
          </div>
        </div>
      </div>

      {/* Department Performance Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Department Comparison Table</h3>
          <p className="text-sm text-gray-600 mt-1">Ranked by resolution rate performance</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Complaints
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resolved
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resolution Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedDepartments.map(([deptName, data], index) => {
                const rank = index + 1;
                const performanceScore = parseFloat(data.resolutionRate);
                const isTopPerformer = rank === 1;
                const isAboveAverage = performanceScore > avgResolutionRate;
                
                return (
                  <tr key={deptName} className={`hover:bg-gray-50 ${isTopPerformer ? 'bg-green-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {isTopPerformer ? (
                          <span className="text-2xl">🥇</span>
                        ) : rank === 2 ? (
                          <span className="text-2xl">🥈</span>
                        ) : rank === 3 ? (
                          <span className="text-2xl">🥉</span>
                        ) : (
                          <span className="text-sm font-medium text-gray-900">#{rank}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded-full mr-3 border-2 border-white shadow-sm" 
                          style={{ backgroundColor: data.color || '#359d49' }}
                        ></div>
                        <span className={`text-sm font-medium ${isTopPerformer ? 'text-green-800' : 'text-gray-900'}`}>
                          {deptName}
                        </span>
                        {isTopPerformer && (
                          <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            Top Performer
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {data.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {data.resolvedCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                          isAboveAverage 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {data.resolutionRate}%
                        </span>
                        {isAboveAverage ? (
                          <span className="ml-2 text-green-600">↗️</span>
                        ) : (
                          <span className="ml-2 text-red-600">↘️</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              isAboveAverage ? 'bg-green-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${performanceScore}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">{performanceScore.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700">🏆 Top Performers</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {sortedDepartments.slice(0, 3).map(([deptName, data], index) => (
                <li key={deptName} className="flex items-center">
                  <span className="mr-2">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </span>
                  <span className="font-medium">{deptName}</span>
                  <span className="ml-auto text-green-600 font-semibold">{data.resolutionRate}%</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700">📊 Performance Analysis</h4>
            <div className="text-sm text-gray-600 space-y-2">
              <div className="flex justify-between">
                <span>Departments above average:</span>
                <span className="font-semibold text-green-600">
                  {sortedDepartments.filter(([, data]) => parseFloat(data.resolutionRate) > avgResolutionRate).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Departments below average:</span>
                <span className="font-semibold text-red-600">
                  {sortedDepartments.filter(([, data]) => parseFloat(data.resolutionRate) <= avgResolutionRate).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Performance gap:</span>
                <span className="font-semibold text-blue-600">
                  {(() => {
                    const rates = Object.values(complaintsByDepartment).map(d => parseFloat(d.resolutionRate));
                    const maxRate = Math.max(...rates);
                    const minRate = Math.min(...rates);
                    return (maxRate - minRate).toFixed(1);
                  })()}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
