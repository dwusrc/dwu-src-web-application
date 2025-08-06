import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const department = searchParams.get('department');
  const role = searchParams.get('role');
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );
    
    // Get current user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile to determine role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, student_id, src_department')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check permissions based on role parameter
    if (role === 'student') {
      // SRC members can view students
      if (profile.role !== 'src') {
        return NextResponse.json({ error: 'Only SRC members can view students' }, { status: 403 });
      }
    } else {
      // Students can view SRC members (default behavior)
      if (profile.role !== 'student') {
        return NextResponse.json({ error: 'Only students can view SRC members' }, { status: 403 });
      }
    }

    // Build query based on role parameter
    let query;
    if (role === 'student') {
      // SRC members want to see students
      query = supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          avatar_url,
          role,
          department,
          year_level,
          created_at
        `)
        .eq('role', 'student')
        .eq('is_active', true);

      // Add department filter if specified (for SRC members to see students from their department)
      if (department) {
        query = query.eq('department', department);
      }

      // Execute query with ordering
      const { data: students, error: studentsError } = await query
        .order('department', { ascending: true })
        .order('full_name', { ascending: true });

      if (studentsError) {
        console.error('Students error:', studentsError);
        return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
      }

      // If no students found, return empty array
      if (!students || students.length === 0) {
        return NextResponse.json({ 
          participants: [],
          total: 0
        });
      }

      // Get existing conversations for this SRC member
      const { data: existingConversations, error: conversationsError } = await supabase
        .from('chat_conversations')
        .select('id, student_id')
        .eq('src_member_id', profile.id);

      if (conversationsError) {
        console.error('Conversations error:', conversationsError);
        return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
      }

      // Create a set of student IDs that the SRC member already has conversations with
      const existingStudentIds = new Set(
        existingConversations?.map(conv => conv.student_id) || []
      );

      // Add conversation status to each student
      const participantsWithStatus = students.map(student => ({
        ...student,
        student_id: student.id, // Use the student's ID as student_id
        has_conversation: existingStudentIds.has(student.id),
        conversation_id: existingConversations?.find(
          conv => conv.student_id === student.id
        )?.id || null
      }));

      return NextResponse.json({ 
        participants: participantsWithStatus,
        total: participantsWithStatus.length
      });
    } else {
      // Students want to see SRC members (default behavior)
      query = supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          avatar_url,
          role,
          src_department,
          created_at
        `)
        .eq('role', 'src')
        .eq('is_active', true);

      // Add department filter if specified
      if (department) {
        query = query.eq('src_department', department);
      }

      // Execute query with ordering
      const { data: srcMembers, error: srcMembersError } = await query
        .order('src_department', { ascending: true })
        .order('full_name', { ascending: true });

      if (srcMembersError) {
        console.error('SRC members error:', srcMembersError);
        return NextResponse.json({ error: 'Failed to fetch SRC members' }, { status: 500 });
      }

      // If no SRC members found, return empty array
      if (!srcMembers || srcMembers.length === 0) {
        return NextResponse.json({ 
          participants: [],
          total: 0
        });
      }

      // Get existing conversations for this student
      const { data: existingConversations, error: conversationsError } = await supabase
        .from('chat_conversations')
        .select('id, src_member_id')
        .eq('student_id', profile.id);

      if (conversationsError) {
        console.error('Conversations error:', conversationsError);
        return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
      }

      // Create a set of SRC member IDs that the student already has conversations with
      const existingSrcMemberIds = new Set(
        existingConversations?.map(conv => conv.src_member_id) || []
      );

      // Add conversation status to each SRC member
      const participantsWithStatus = srcMembers.map(member => ({
        ...member,
        src_member_id: member.id, // Use the member's ID as src_member_id
        has_conversation: existingSrcMemberIds.has(member.id),
        conversation_id: existingConversations?.find(
          conv => conv.src_member_id === member.id
        )?.id || null
      }));

      return NextResponse.json({ 
        participants: participantsWithStatus,
        total: participantsWithStatus.length
      });
    }
  } catch (error) {
    console.error('Unexpected error in participants API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 