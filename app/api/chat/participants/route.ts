import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(_request: NextRequest) {
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

    console.log('User authenticated:', user.id);

    // Get user profile to determine role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, student_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    console.log('User profile:', { role: profile.role, student_id: profile.student_id });

    // Only students can see available SRC members
    if (profile.role !== 'student') {
      return NextResponse.json({ error: 'Only students can view participants' }, { status: 403 });
    }

    // Get all active SRC members
    const { data: srcMembers, error: srcMembersError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        avatar_url,
        role,
        created_at
      `)
      .eq('role', 'src')
      .order('full_name', { ascending: true });

    if (srcMembersError) {
      console.error('SRC members error:', srcMembersError);
      return NextResponse.json({ error: 'Failed to fetch SRC members' }, { status: 500 });
    }

    console.log('SRC members found:', srcMembers?.length || 0);

    // If no SRC members found, return empty array
    if (!srcMembers || srcMembers.length === 0) {
      console.log('No SRC members found in database');
      return NextResponse.json({ 
        participants: [],
        total: 0
      });
    }

    // Get existing conversations for this student
    // Use profile.id (UUID) instead of profile.student_id (TEXT)
    const { data: existingConversations, error: conversationsError } = await supabase
      .from('chat_conversations')
      .select('id, src_member_id')
      .eq('student_id', profile.id); // Use profile.id (UUID) here

    if (conversationsError) {
      console.error('Conversations error:', conversationsError);
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    console.log('Existing conversations:', existingConversations?.length || 0);

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

    console.log('Returning participants:', participantsWithStatus.length);

    return NextResponse.json({ 
      participants: participantsWithStatus,
      total: participantsWithStatus.length
    });
  } catch (error) {
    console.error('Unexpected error in participants API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 