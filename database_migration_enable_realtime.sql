-- Migration: Enable real-time for chat tables
-- This enables Supabase real-time subscriptions for chat_conversations and chat_messages tables

-- Enable real-time for chat_conversations table
ALTER PUBLICATION supabase_realtime ADD TABLE chat_conversations;

-- Enable real-time for chat_messages table
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- Verification
SELECT 
  schemaname,
  tablename,
  pubname
FROM pg_publication_tables 
WHERE tablename IN ('chat_conversations', 'chat_messages')
AND pubname = 'supabase_realtime';

-- Expected output should show both tables are now part of the realtime publication 