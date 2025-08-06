-- Migration: Add INSERT policy for chat_conversations
-- This allows users to create conversations where they are either the student or SRC member

-- Add INSERT policy for chat_conversations
CREATE POLICY "Users can create conversations" ON chat_conversations
  FOR INSERT WITH CHECK (
    student_id = auth.uid() OR src_member_id = auth.uid()
  );

-- Add UPDATE policy for chat_conversations (for updating last_message_at, etc.)
CREATE POLICY "Users can update own conversations" ON chat_conversations
  FOR UPDATE USING (
    student_id = auth.uid() OR src_member_id = auth.uid()
  );

-- Verification
SELECT 'Chat conversation INSERT policy added successfully' as status; 