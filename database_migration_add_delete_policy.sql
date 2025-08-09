-- Migration: Add DELETE policy for chat_messages table
-- This migration adds the missing DELETE policy that allows users to delete messages in their conversations

-- Add DELETE policy for chat_messages
CREATE POLICY "Users can delete messages in their conversations" ON chat_messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM chat_conversations 
      WHERE id = chat_messages.conversation_id 
      AND (student_id = auth.uid() OR src_member_id = auth.uid())
    )
  );

-- Verify the policy was created
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'chat_messages' AND cmd = 'DELETE'
ORDER BY policyname;