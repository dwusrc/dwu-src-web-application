import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    
    // Get report details
    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', resolvedParams.id)
      .single();

    if (fetchError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Get user profile for visibility check
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check if user can access this report
    let canAccess = false;
    if (profile.role === 'admin') {
      canAccess = true;
    } else if (profile.role === 'src' && report.visibility.includes('src')) {
      canAccess = true;
    } else if (profile.role === 'student' && report.visibility.includes('student')) {
      canAccess = true;
    }

    if (!canAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Increment download count
    const { error: updateError } = await supabase
      .from('reports')
      .update({ download_count: (report.download_count || 0) + 1 })
      .eq('id', resolvedParams.id);

    if (updateError) {
      console.error('Error updating download count:', updateError);
      // Don't fail the request if download count update fails
    }

    // Return file information for download
    return NextResponse.json({
      file_url: report.file_url,
      file_name: report.file_name,
      download_count: (report.download_count || 0) + 1
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
