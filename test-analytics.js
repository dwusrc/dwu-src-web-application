// Simple test script for the Analytics API
// Run this with: node test-analytics.js

const testAnalyticsAPI = async () => {
  try {
    console.log('🧪 Testing Analytics API...');
    
    const response = await fetch('http://localhost:3000/api/analytics/overview');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Analytics API Response:');
      console.log('Status:', response.status);
      console.log('Success:', data.success);
      console.log('Timestamp:', data.timestamp);
      
      if (data.data) {
        console.log('\n📊 Analytics Data:');
        console.log('Total Complaints:', data.data.overview.totalComplaints);
        console.log('Pending Complaints:', data.data.overview.pendingComplaints);
        console.log('Resolution Rate:', data.data.overview.resolutionRate + '%');
        console.log('Avg Response Time:', data.data.overview.avgResponseTime + 'h');
        
        console.log('\n🏢 Departments:', Object.keys(data.data.complaintsByDepartment).length);
        Object.entries(data.data.complaintsByDepartment).forEach(([dept, info]) => {
          console.log(`  - ${dept}: ${info.count} complaints, ${info.resolutionRate}% resolved`);
        });
        
        console.log('\n📈 Recent Trends:');
        console.log('  - Last 7 days:', data.data.recentTrends.last7Days);
        console.log('  - Last 30 days:', data.data.recentTrends.last30Days);
        console.log('  - Last 90 days:', data.data.recentTrends.last90Days);
        
        console.log('\n🏆 Performance:');
        console.log('  - Top Department:', data.data.performanceMetrics.topPerformingDepartment);
        console.log('  - Best Resolution Rate:', data.data.performanceMetrics.highestResolutionRate + '%');
      }
    } else {
      console.log('❌ Analytics API Error:');
      console.log('Status:', response.status);
      const errorData = await response.text();
      console.log('Error:', errorData);
    }
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
};

// Run the test
testAnalyticsAPI();
