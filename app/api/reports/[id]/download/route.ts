import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { createClient } from '@supabase/supabase-js';

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

    // Generate a signed URL for private bucket access (valid for 1 hour)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Extract the file path from the file_url
    // file_url format: https://[project].supabase.co/storage/v1/object/public/reports/[user_id]/[filename]
    const urlParts = report.file_url.split('/');
    const bucketName = 'reports';
    const filePath = urlParts.slice(urlParts.indexOf('reports') + 1).join('/');

    // Generate signed URL with 1 hour expiry
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from(bucketName)
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (signedUrlError) {
      console.error('Error generating signed URL:', signedUrlError);
      return NextResponse.json({ error: 'Failed to generate download link' }, { status: 500 });
    }

    // Return signed URL for download
    return NextResponse.json({
      file_url: signedUrlData.signedUrl,
      file_name: report.file_name,
      download_count: (report.download_count || 0) + 1,
      expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
