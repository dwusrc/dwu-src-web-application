-- Comprehensive fix for real-time RLS policies
-- This migration creates more permissive policies that work with real-time subscriptions

-- First, let's check what policies currently exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('chat_messages', 'chat_conversations')
ORDER BY tablename, policyname;

-- Drop ALL existing policies on chat tables
DROP POLICY IF EXISTS "Users can view own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can send messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can update own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON chat_messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON chat_messages;
DROP POLICY IF EXISTS "Users can update messages in their conversations" ON chat_messages;
DROP POLICY IF EXISTS "Real-time subscription access" ON chat_messages;

DROP POLICY IF EXISTS "Users can view own conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Users can view their conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Real-time subscription access conversations" ON chat_conversations;

-- Create simplified, more permissive policies for chat_messages
CREATE POLICY "chat_messages_select_policy" ON chat_messages
  FOR SELECT USING (
    -- Allow access if user is authenticated and has any conversations
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM chat_conversations 
      WHERE id = chat_messages.conversation_id 
      AND (student_id = auth.uid() OR src_member_id = auth.uid())
    )
  );

CREATE POLICY "chat_messages_insert_policy" ON chat_messages
  FOR INSERT WITH CHECK (
    -- Allow insert if user is the sender and has access to the conversation
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM chat_conversations 
      WHERE id = chat_messages.conversation_id 
      AND (student_id = auth.uid() OR src_member_id = auth.uid())
    )
  );

CREATE POLICY "chat_messages_update_policy" ON chat_messages
  FOR UPDATE USING (
    -- Allow update if user has access to the conversation
    EXISTS (
      SELECT 1 FROM chat_conversations 
      WHERE id = chat_messages.conversation_id 
      AND (student_id = auth.uid() OR src_member_id = auth.uid())
    )
  );

-- Create simplified, more permissive policies for chat_conversations
CREATE POLICY "chat_conversations_select_policy" ON chat_conversations
  FOR SELECT USING (
    -- Allow access if user is authenticated and is part of the conversation
    auth.uid() IS NOT NULL AND
    (student_id = auth.uid() OR src_member_id = auth.uid())
  );

CREATE POLICY "chat_conversations_insert_policy" ON chat_conversations
  FOR INSERT WITH CHECK (
    -- Allow insert if user is part of the conversation
    student_id = auth.uid() OR src_member_id = auth.uid()
  );

CREATE POLICY "chat_conversations_update_policy" ON chat_conversations
  FOR UPDATE USING (
    -- Allow update if user is part of the conversation
    student_id = auth.uid() OR src_member_id = auth.uid()
  );

-- Ensure RLS is enabled
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

-- Verify real-time is enabled for both tables
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

-- Verify the setup
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename IN ('chat_messages', 'chat_conversations')
ORDER BY tablename, policyname;

-- Check real-time publication
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename IN ('chat_messages', 'chat_conversations'); 