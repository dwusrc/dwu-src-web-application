-- Fix RLS policies for real-time subscriptions
-- This migration adds more permissive policies for real-time events

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can send messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can update own messages" ON chat_messages;

-- Create more permissive policies that work with real-time
CREATE POLICY "Users can view messages in their conversations" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_conversations 
      WHERE id = chat_messages.conversation_id 
      AND (student_id = auth.uid() OR src_member_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations" ON chat_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM chat_conversations 
      WHERE id = chat_messages.conversation_id 
      AND (student_id = auth.uid() OR src_member_id = auth.uid())
    )
  );

CREATE POLICY "Users can update messages in their conversations" ON chat_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM chat_conversations 
      WHERE id = chat_messages.conversation_id 
      AND (student_id = auth.uid() OR src_member_id = auth.uid())
    )
  );

-- Add a policy for real-time subscriptions (more permissive)
CREATE POLICY "Real-time subscription access" ON chat_messages
  FOR SELECT USING (
    -- Allow access if user is authenticated and has any conversations
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM chat_conversations 
      WHERE (student_id = auth.uid() OR src_member_id = auth.uid())
    )
  );

-- Also fix conversation policies
DROP POLICY IF EXISTS "Users can view own conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON chat_conversations;

CREATE POLICY "Users can view their conversations" ON chat_conversations
  FOR SELECT USING (
    student_id = auth.uid() OR src_member_id = auth.uid()
  );

CREATE POLICY "Users can create conversations" ON chat_conversations
  FOR INSERT WITH CHECK (
    student_id = auth.uid() OR src_member_id = auth.uid()
  );

CREATE POLICY "Users can update their conversations" ON chat_conversations
  FOR UPDATE USING (
    student_id = auth.uid() OR src_member_id = auth.uid()
  );

-- Add real-time subscription policy for conversations
CREATE POLICY "Real-time subscription access conversations" ON chat_conversations
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    (student_id = auth.uid() OR src_member_id = auth.uid())
  );

-- Verify real-time is enabled
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename IN ('chat_messages', 'chat_conversations');

-- If not found, add them
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'chat_conversations') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_conversations;
  END IF;
END $$; 