-- Migration: Remove Chat System from Database
-- This migration removes all chat-related tables, policies, and configurations
-- Run this migration to completely remove the chat system from the database

-- Phase 3: Database Schema Cleanup

-- 1. Remove real-time publications for chat tables
DO $$
BEGIN
    -- Remove chat_messages from real-time publication if it exists
    IF EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE tablename = 'chat_messages' 
        AND pubname = 'supabase_realtime'
    ) THEN
        ALTER PUBLICATION supabase_realtime DROP TABLE chat_messages;
        RAISE NOTICE 'Removed chat_messages from real-time publication';
    ELSE
        RAISE NOTICE 'chat_messages not found in real-time publication';
    END IF;

    -- Remove chat_conversations from real-time publication if it exists
    IF EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE tablename = 'chat_conversations' 
        AND pubname = 'supabase_realtime'
    ) THEN
        ALTER PUBLICATION supabase_realtime DROP TABLE chat_conversations;
        RAISE NOTICE 'Removed chat_conversations from real-time publication';
    ELSE
        RAISE NOTICE 'chat_conversations not found in real-time publication';
    END IF;
END $$;

-- 2. Drop all chat-related RLS policies
-- Drop policies for chat_messages
DROP POLICY IF EXISTS "Users can view own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can send messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can update own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON chat_messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON chat_messages;
DROP POLICY IF EXISTS "Users can update messages in their conversations" ON chat_messages;
DROP POLICY IF EXISTS "Real-time subscription access" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_select_policy" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert_policy" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_update_policy" ON chat_messages;

-- Drop policies for chat_conversations
DROP POLICY IF EXISTS "Users can view own conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Users can view their conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Real-time subscription access conversations" ON chat_conversations;
DROP POLICY IF EXISTS "chat_conversations_select_policy" ON chat_conversations;
DROP POLICY IF EXISTS "chat_conversations_insert_policy" ON chat_conversations;
DROP POLICY IF EXISTS "chat_conversations_update_policy" ON chat_conversations;

-- 3. Drop chat-related indexes
DROP INDEX IF EXISTS idx_chat_messages_conversation_id;
DROP INDEX IF EXISTS idx_chat_messages_created_at;
DROP INDEX IF EXISTS idx_chat_messages_sender_id;
DROP INDEX IF EXISTS idx_chat_messages_is_read;
DROP INDEX IF EXISTS idx_chat_conversations_student_id;
DROP INDEX IF EXISTS idx_chat_conversations_src_member_id;
DROP INDEX IF EXISTS idx_chat_conversations_updated_at;

-- 4. Drop chat-related triggers (if any exist)
-- Note: We'll check for triggers first
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table IN ('chat_messages', 'chat_conversations')
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_record.trigger_name || ' ON ' || trigger_record.event_object_table || ' CASCADE';
        RAISE NOTICE 'Dropped trigger: %', trigger_record.trigger_name;
    END LOOP;
END $$;

-- 5. Drop chat-related functions (if any exist)
-- Note: We'll check for functions first
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_name LIKE '%chat%' 
        AND routine_schema = 'public'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || func_record.routine_name || ' CASCADE';
        RAISE NOTICE 'Dropped function: %', func_record.routine_name;
    END LOOP;
END $$;

-- 6. Drop chat-related custom types
DROP TYPE IF EXISTS message_type CASCADE;

-- 7. Drop chat tables (this will cascade to any dependent objects)
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_conversations CASCADE;

-- 8. Remove chat-related references from notifications table
-- Update notification_type enum to remove 'chat_message'
-- First, create a new enum without chat_message
CREATE TYPE notification_type_new AS ENUM (
  'complaint_update', 'news_post', 'forum_reply', 'system'
);

-- Update existing notifications to remove chat_message references
UPDATE notifications 
SET type = 'system' 
WHERE type = 'chat_message';

-- Drop the old enum and rename the new one
ALTER TABLE notifications ALTER COLUMN type TYPE notification_type_new USING type::text::notification_type_new;
DROP TYPE notification_type;
ALTER TYPE notification_type_new RENAME TO notification_type;

-- 9. Clean up any remaining chat-related data
-- Remove any chat-related notifications
DELETE FROM notifications WHERE reference_type = 'chat';

-- 10. Verify cleanup
-- Check that chat tables are gone
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_messages') THEN
        RAISE NOTICE 'chat_messages table successfully removed';
    ELSE
        RAISE NOTICE 'WARNING: chat_messages table still exists';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_conversations') THEN
        RAISE NOTICE 'chat_conversations table successfully removed';
    ELSE
        RAISE NOTICE 'WARNING: chat_conversations table still exists';
    END IF;
END $$;

-- Check remaining tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check remaining policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check remaining indexes
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

RAISE NOTICE 'Chat system removal migration completed successfully!';
