-- Migration: Fix real-time configuration for chat functionality
-- This migration ensures proper real-time setup and RLS policies

-- 1. Enable real-time for chat tables (if not already enabled)
DO $$
BEGIN
    -- Add chat_messages to real-time publication if not already there
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE tablename = 'chat_messages' 
        AND pubname = 'supabase_realtime'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
        RAISE NOTICE 'Added chat_messages to real-time publication';
    ELSE
        RAISE NOTICE 'chat_messages already in real-time publication';
    END IF;

    -- Add chat_conversations to real-time publication if not already there
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE tablename = 'chat_conversations' 
        AND pubname = 'supabase_realtime'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE chat_conversations;
        RAISE NOTICE 'Added chat_conversations to real-time publication';
    ELSE
        RAISE NOTICE 'chat_conversations already in real-time publication';
    END IF;
END $$;

-- 2. Ensure RLS is enabled on chat tables
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view own conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON chat_conversations;

DROP POLICY IF EXISTS "Users can view own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can send messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can update own messages" ON chat_messages;

-- 4. Create comprehensive RLS policies for chat_conversations
CREATE POLICY "Users can view own conversations" ON chat_conversations
  FOR SELECT USING (
    student_id = auth.uid() OR src_member_id = auth.uid()
  );

CREATE POLICY "Users can create conversations" ON chat_conversations
  FOR INSERT WITH CHECK (
    student_id = auth.uid() OR src_member_id = auth.uid()
  );

CREATE POLICY "Users can update own conversations" ON chat_conversations
  FOR UPDATE USING (
    student_id = auth.uid() OR src_member_id = auth.uid()
  );

-- 5. Create comprehensive RLS policies for chat_messages
CREATE POLICY "Users can view own messages" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_conversations 
      WHERE id = chat_messages.conversation_id 
      AND (student_id = auth.uid() OR src_member_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages" ON chat_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM chat_conversations 
      WHERE id = chat_messages.conversation_id 
      AND (student_id = auth.uid() OR src_member_id = auth.uid())
    )
  );

CREATE POLICY "Users can update own messages" ON chat_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM chat_conversations 
      WHERE id = chat_messages.conversation_id 
      AND (student_id = auth.uid() OR src_member_id = auth.uid())
    )
  );

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_read ON chat_messages(is_read);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_student_id ON chat_conversations(student_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_src_member_id ON chat_conversations(src_member_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_updated_at ON chat_conversations(updated_at DESC);

-- 7. Verification queries
SELECT 'Real-time configuration verification:' as info;

-- Check if tables are in real-time publication
SELECT 
  schemaname,
  tablename,
  pubname,
  '✓' as status
FROM pg_publication_tables 
WHERE tablename IN ('chat_conversations', 'chat_messages')
AND pubname = 'supabase_realtime'
ORDER BY tablename;

-- Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  '✓' as status
FROM pg_tables 
WHERE tablename IN ('chat_conversations', 'chat_messages')
AND schemaname = 'public'
ORDER BY tablename;

-- Check policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check,
  '✓' as status
FROM pg_policies 
WHERE tablename IN ('chat_conversations', 'chat_messages')
AND schemaname = 'public'
ORDER BY tablename, policyname;

-- Check indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef,
  '✓' as status
FROM pg_indexes 
WHERE tablename IN ('chat_conversations', 'chat_messages')
AND schemaname = 'public'
ORDER BY tablename, indexname;

SELECT 'Migration completed successfully!' as status; 