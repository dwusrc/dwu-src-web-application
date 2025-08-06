-- Add missing RLS policy for creating chat conversations
-- Students can create conversations with SRC members
CREATE POLICY "Students can create conversations" ON chat_conversations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'student'
    ) AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = chat_conversations.src_member_id AND role = 'src'
    )
  );

-- Users can update their own conversations (for updating last_message_at, etc.)
CREATE POLICY "Users can update own conversations" ON chat_conversations
  FOR UPDATE USING (
    student_id = auth.uid() OR src_member_id = auth.uid()
  ); 