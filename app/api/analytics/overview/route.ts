import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Types for analytics data
interface DepartmentData {
  count: number;
  resolvedCount: number;
  resolutionRate: string;
  color: string;
}

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
  complaintsByDepartment: Record<string, DepartmentData>;
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

export async function GET() {
  try {
    console.log('🔍 Analytics API: Fetching comprehensive complaint analytics...');

    // 1. Basic complaint counts
    const { data: totalComplaints, error: totalError } = await supabase
      .from('complaints')
      .select('id', { count: 'exact' });

    if (totalError) {
      console.error('❌ Error fetching total complaints:', totalError);
      return NextResponse.json({ error: 'Failed to fetch total complaints' }, { status: 500 });
    }

    // 2. Complaints by status
    const { data: statusData, error: statusError } = await supabase
      .from('complaints')
      .select('status')
      .not('status', 'is', null);

    if (statusError) {
      console.error('❌ Error fetching status data:', statusError);
      return NextResponse.json({ error: 'Failed to fetch status data' }, { status: 500 });
    }

    // 3. Complaints by priority
    const { data: priorityData, error: priorityError } = await supabase
      .from('complaints')
      .select('priority')
      .not('priority', 'is', null);

    if (priorityError) {
      console.error('❌ Error fetching priority data:', priorityError);
      return NextResponse.json({ error: 'Failed to fetch priority data' }, { status: 500 });
    }

    // 4. Department performance data - Fixed to handle array relationship
    const { data: departmentData, error: deptError } = await supabase
      .from('src_departments')
      .select('id, name, color');

    if (deptError) {
      console.error('❌ Error fetching department data:', deptError);
      return NextResponse.json({ error: 'Failed to fetch department data' }, { status: 500 });
    }

    // Get complaints data separately to calculate department performance
    const { data: allComplaints, error: complaintsError } = await supabase
      .from('complaints')
      .select('id, status, created_at, updated_at, assigned_to, departments_selected');

    if (complaintsError) {
      console.error('❌ Error fetching complaints for department analysis:', complaintsError);
      return NextResponse.json({ error: 'Failed to fetch complaints data' }, { status: 500 });
    }

    // 5. Response time calculations
    const { data: responseTimeData, error: responseError } = await supabase
      .from('complaints')
      .select('created_at, updated_at, status, assigned_to')
      .not('assigned_to', 'is', null)
      .in('status', ['resolved', 'closed']);

    if (responseError) {
      console.error('❌ Error fetching response time data:', responseError);
      return NextResponse.json({ error: 'Failed to fetch response time data' }, { status: 500 });
    }

    // 6. Recent trends (last 7, 30, 90 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const { data: trendsData, error: trendsError } = await supabase
      .from('complaints')
      .select('created_at');

    if (trendsError) {
      console.error('❌ Error fetching trends data:', trendsError);
      return NextResponse.json({ error: 'Failed to fetch trends data' }, { status: 500 });
    }

    // Process the data
    const totalCount = totalComplaints?.length || 0;

    // Process status data
    const complaintsByStatus: Record<string, number> = {};
    statusData?.forEach(complaint => {
      complaintsByStatus[complaint.status] = (complaintsByStatus[complaint.status] || 0) + 1;
    });

    // Process priority data
    const complaintsByPriority: Record<string, number> = {};
    priorityData?.forEach(complaint => {
      complaintsByPriority[complaint.priority] = (complaintsByPriority[complaint.priority] || 0) + 1;
    });

    // Process department data
    const complaintsByDepartment: Record<string, DepartmentData> = {};
    departmentData?.forEach(dept => {
      // Filter complaints that include this department in their departments_selected array
      const deptComplaints = allComplaints?.filter((c: { departments_selected: string[] }) => 
        c.departments_selected && c.departments_selected.includes(dept.id)
      ) || [];
      
      const resolvedCount = deptComplaints.filter((c: { status: string }) => 
        c.status === 'resolved' || c.status === 'closed'
      ).length;
      
      complaintsByDepartment[dept.name] = {
        count: deptComplaints.length,
        resolvedCount,
        resolutionRate: deptComplaints.length > 0 ? (resolvedCount / deptComplaints.length * 100).toFixed(1) : '0',
        color: dept.color
      };
    });

    // Calculate response times
    let totalResponseTime = 0;
    let validResponseCount = 0;
    
    responseTimeData?.forEach(complaint => {
      if (complaint.created_at && complaint.updated_at) {
        const created = new Date(complaint.created_at);
        const updated = new Date(complaint.updated_at);
        const responseTimeHours = (updated.getTime() - created.getTime()) / (1000 * 60 * 60);
        totalResponseTime += responseTimeHours;
        validResponseCount++;
      }
    });

    const avgResponseTime = validResponseCount > 0 ? (totalResponseTime / validResponseCount).toFixed(1) : '0';

    // Calculate recent trends
    let last7Days = 0;
    let last30Days = 0;
    let last90Days = 0;

    trendsData?.forEach(complaint => {
      if (complaint.created_at) {
        const created = new Date(complaint.created_at);
        if (created >= sevenDaysAgo) last7Days++;
        if (created >= thirtyDaysAgo) last30Days++;
        if (created >= ninetyDaysAgo) last90Days++;
      }
    });

    // Calculate resolution rate
    const resolvedCount = (complaintsByStatus.resolved || 0) + (complaintsByStatus.closed || 0);
    const resolutionRate = totalCount > 0 ? ((resolvedCount / totalCount) * 100).toFixed(1) : '0';

    // Calculate percentage within 24h response
    let within24h = 0;
    responseTimeData?.forEach(complaint => {
      if (complaint.created_at && complaint.updated_at) {
        const created = new Date(complaint.created_at);
        const updated = new Date(complaint.updated_at);
        const responseTimeHours = (updated.getTime() - created.getTime()) / (1000 * 60 * 60);
        if (responseTimeHours <= 24) within24h++;
      }
    });

    const avgResponseTime24h = validResponseCount > 0 ? ((within24h / validResponseCount) * 100).toFixed(1) : '0';

    // Find top performing department
    let topPerformingDepartment = 'None';
    let highestResolutionRate = '0';
    
    Object.entries(complaintsByDepartment).forEach(([deptName, data]) => {
      if (parseFloat(data.resolutionRate) > parseFloat(highestResolutionRate)) {
        highestResolutionRate = data.resolutionRate;
        topPerformingDepartment = deptName;
      }
    });

    // Prepare the response
    const analyticsData: AnalyticsData = {
      overview: {
        totalComplaints: totalCount,
        pendingComplaints: complaintsByStatus.pending || 0,
        resolvedComplaints: resolvedCount,
        avgResponseTime: parseFloat(avgResponseTime),
        resolutionRate,
        avgResponseTime24h
      },
      complaintsByStatus,
      complaintsByPriority,
      complaintsByDepartment,
      recentTrends: {
        last7Days,
        last30Days,
        last90Days
      },
      performanceMetrics: {
        topPerformingDepartment,
        highestResolutionRate,
        fastestResponseTime: avgResponseTime
      }
    };

    console.log('✅ Analytics API: Successfully generated analytics data');
    console.log('📊 Overview:', analyticsData.overview);
    console.log('🏆 Top Performing Department:', topPerformingDepartment);

    return NextResponse.json({
      success: true,
      data: analyticsData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Analytics API Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
