import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function DELETE(request: NextRequest) {
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

    const body = await request.json();
    const { conversation_id } = body;

    if (!conversation_id) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    // Get user profile to determine role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, student_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Verify user has access to this conversation
    const { data: conversation, error: conversationError } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('id', conversation_id)
      .single();

    if (conversationError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Check if user is part of this conversation
    const isStudentInConversation = profile.role === 'student' && conversation.student_id === profile.id;
    const isSrcMemberInConversation = profile.role === 'src' && conversation.src_member_id === profile.id;

    if (!isStudentInConversation && !isSrcMemberInConversation) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete all messages in the conversation
    const { error: deleteError } = await supabase
      .from('chat_messages')
      .delete()
      .eq('conversation_id', conversation_id);

    if (deleteError) {
      console.error('Error deleting messages:', deleteError);
      return NextResponse.json({ 
        error: 'Failed to clear messages',
        details: deleteError.message 
      }, { status: 500 });
    }

    // Update conversation's updated_at timestamp
    const { error: updateError } = await supabase
      .from('chat_conversations')
      .update({ 
        updated_at: new Date().toISOString(),
        last_message_at: null
      })
      .eq('id', conversation_id);

    if (updateError) {
      console.error('Error updating conversation timestamp:', updateError);
      // Don't fail the operation if timestamp update fails
    }

    console.log(`✅ Successfully cleared all messages for conversation: ${conversation_id}`);

    return NextResponse.json({ 
      success: true,
      message: 'All messages cleared successfully'
    });
  } catch (error) {
    console.error('Unexpected error in clear messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 