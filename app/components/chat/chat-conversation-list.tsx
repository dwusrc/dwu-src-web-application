'use client';

import { useState, useEffect, useRef } from 'react';
import { ChatConversation, ChatMessage } from '@/lib/chat-api';
import { chatApi } from '@/lib/chat-api';
import { supabase } from '@/lib/supabaseClient';

interface ChatConversationListProps {
  onSelectConversation: (conversation: ChatConversation) => void;
  selectedConversationId?: string;
  currentUserId: string;
  userRole?: 'student' | 'src' | 'admin';
  onMarkMessagesAsRead?: (conversationId: string) => void;
  onConversationsUpdate?: (conversations: ChatConversation[]) => void;
}

export function ChatConversationList({
  onSelectConversation,
  selectedConversationId,
  currentUserId,
  userRole = 'student',
  onMarkMessagesAsRead,
  onConversationsUpdate,
}: ChatConversationListProps) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const processedMessageIds = useRef<Set<string>>(new Set());
  const conversationsRef = useRef<ChatConversation[]>([]);

  // Keep conversationsRef in sync with conversations state
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    fetchConversations();
    subscribeToMessageUpdates();
    testRealTimeConnection(); // Test connection on mount
    
    // Start polling as a fallback (will be cleared if real-time works)
    startPollingFallback();
    
    return () => {
      unsubscribeFromMessageUpdates();
    };
  }, [currentUserId]); // Re-subscribe when currentUserId changes

  const fetchConversations = async (isRealTimeUpdate = false) => {
    try {
      // Only show loading spinner on initial load, not on real-time updates
      if (!isRealTimeUpdate) {
        setLoading(true);
      }
      
      const data = await chatApi.getConversations();
      
      setConversations(data);
      conversationsRef.current = data; // Update ref with latest conversations
      onConversationsUpdate?.(data); // Notify parent component of updates
      setError(null);
    } catch (err) {
      setError('Failed to load conversations');
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatLastMessage = (conversation: ChatConversation) => {
    if (!conversation.messages || conversation.messages.length === 0) {
      return '📬 New conversation available';
    }
    
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    const isOwnMessage = lastMessage.sender_id === currentUserId;
    
    if (isOwnMessage) {
      return `You: ${lastMessage.content.substring(0, 50)}${lastMessage.content.length > 50 ? '...' : ''}`;
    } else {
      // Check if there are new unread messages from sender after receiver's last message
      const unreadCount = getUnreadCount(conversation);
      if (unreadCount > 0) {
        const participantName = getConversationName(conversation);
        return `📬 ${unreadCount} new message${unreadCount > 1 ? 's' : ''} from ${participantName}!`;
      } else {
        // Show the last message content if it's read
        return `📨 ${lastMessage.content.substring(0, 50)}${lastMessage.content.length > 50 ? '...' : ''}`;
      }
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getUnreadCount = (conversation: ChatConversation) => {
    if (!conversation.messages) return 0;
    
    // Get all messages from other users (sender messages)
    const senderMessages = conversation.messages.filter(
      msg => msg.sender_id !== currentUserId
    );
    
    if (senderMessages.length === 0) return 0;
    
    // Count all unread messages from sender
    const unreadMessages = senderMessages.filter(msg => !msg.is_read);
    const count = unreadMessages.length;
    
    console.log(`Conversation ${conversation.id}: ${count} total unread messages from sender`);
    return count;
  };

  const getLatestUnreadMessage = (conversation: ChatConversation) => {
    if (!conversation.messages) return null;
    
    // Get all messages from other users (sender messages)
    const senderMessages = conversation.messages.filter(
      msg => msg.sender_id !== currentUserId
    );
    
    if (senderMessages.length === 0) return null;
    
    // Get all unread messages from sender
    const unreadMessages = senderMessages.filter(msg => !msg.is_read);
    
    // Return the latest unread message
    return unreadMessages.length > 0 ? unreadMessages[unreadMessages.length - 1] : null;
  };

  // Helper function to get the correct conversation name based on user role
  const getConversationName = (conversation: ChatConversation) => {
    if (userRole === 'src') {
      // For SRC members, show the student's name
      return conversation.student?.full_name || 'Student';
    } else {
      // For students, show the SRC member's name
      return conversation.src_member?.full_name || 'SRC Member';
    }
  };

  // Helper function to get the conversation participant's department
  const getConversationDepartment = (conversation: ChatConversation) => {
    if (userRole === 'src') {
      // For SRC members, show the student's department
      return conversation.student?.department;
    } else {
      // For students, show the SRC member's department
      return conversation.src_member?.src_department;
    }
  };

  const subscribeToMessageUpdates = () => {
    console.log('Setting up real-time subscription for user:', currentUserId);
    
    // Prevent multiple subscriptions
    if (subscriptionRef.current) {
      console.log('Subscription already exists, skipping...');
      return;
    }
    
    try {
      const subscription = supabase
        .channel(`chat_conversation_updates_${currentUserId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
          },
          (payload: { new: Record<string, unknown> }) => {
            console.log('🎉 New message received in conversation list:', JSON.stringify(payload, null, 2));
            console.log('Message details:', {
              id: payload.new.id,
              conversation_id: payload.new.conversation_id,
              sender_id: payload.new.sender_id,
              content: typeof payload.new.content === 'string' ? payload.new.content.substring(0, 50) + '...' : payload.new.content,
              created_at: payload.new.created_at
            });
            const newMessage = payload.new as { id: string; conversation_id: string; sender_id: string; content: string; created_at: string; is_read: boolean; sender_type?: string; message_type?: string };
            
            // Only handle messages NOT from current user
            if (newMessage.sender_id !== currentUserId) {
              // Check if this message belongs to one of the user's conversations
              const isUserConversation = conversationsRef.current.some(conv => conv.id === newMessage.conversation_id);
              if (isUserConversation) {
                handleNewMessage(newMessage);
              } else {
                console.log('Message not from user conversation, refreshing all conversations');
                fetchConversations(true);
              }
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'chat_messages',
          },
          (payload: { new: Record<string, unknown> }) => {
            console.log('Message updated in conversation list:', payload);
            const updatedMessage = payload.new;
            
            // Only handle updates on messages NOT from current user
            if (updatedMessage.sender_id !== currentUserId) {
              // Refresh conversations when messages are updated (e.g., marked as read)
              fetchConversations(true);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_conversations',
          },
          (payload: { new: Record<string, unknown> }) => {
            console.log('New conversation created:', payload);
            // Refresh conversations when a new conversation is created
            fetchConversations(true);
          }
        )
        .subscribe((status) => {
          console.log('Conversation list subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to conversation list real-time updates');
            setSubscriptionStatus('connected');
            // Clear any polling interval if real-time is working
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Failed to subscribe to conversation list real-time updates');
            setSubscriptionStatus('error');
            subscriptionRef.current = null; // Clear the reference
            // Start polling as fallback
            startPollingFallback();
            // Try to reconnect after a delay
            setTimeout(() => {
              console.log('Attempting to reconnect to real-time...');
              subscribeToMessageUpdates();
            }, 5000);
          } else if (status === 'CLOSED') {
            console.log('Real-time connection closed, attempting to reconnect...');
            setSubscriptionStatus('connecting');
            subscriptionRef.current = null; // Clear the reference
            // Try to reconnect after a delay
            setTimeout(() => {
              console.log('Attempting to reconnect to real-time...');
              subscribeToMessageUpdates();
            }, 3000);
          } else if (status === 'TIMED_OUT') {
            console.log('Real-time connection timed out, attempting to reconnect...');
            setSubscriptionStatus('connecting');
            subscriptionRef.current = null; // Clear the reference
            // Try to reconnect after a delay
            setTimeout(() => {
              console.log('Attempting to reconnect to real-time...');
              subscribeToMessageUpdates();
            }, 3000);
          }
        });

      subscriptionRef.current = subscription;
    } catch (error) {
      console.error('Error setting up real-time subscription:', error);
      setSubscriptionStatus('error');
      // Start polling as fallback
      startPollingFallback();
    }
  };

  const unsubscribeFromMessageUpdates = () => {
    if (subscriptionRef.current) {
      console.log('Unsubscribing from real-time updates');
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }
    
    // Clear polling interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    // Clear processed message IDs to prevent memory leaks
    processedMessageIds.current.clear();
    
    // Clear conversations ref
    conversationsRef.current = [];
  };

  const startPollingFallback = () => {
    console.log('Starting polling fallback for conversation updates');
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    // Start with more frequent polling (every 2 seconds) for immediate feedback
    pollingIntervalRef.current = setInterval(() => {
      console.log('Polling for conversation updates...');
      fetchConversations(true);
    }, 2000); // Poll every 2 seconds for immediate feedback
  };

  const testRealTimeConnection = async () => {
    console.log('Testing real-time connection...');
    try {
      // Test if we can connect to Supabase and access chat_messages table
      const { data, error } = await supabase
        .from('chat_messages')
        .select('id')
        .limit(1);
      
      if (error) {
        console.error('Supabase connection test failed:', error);
        setSubscriptionStatus('error');
        return;
      }
      
      console.log('Supabase connection test successful');
      
      // Test if we can access chat_conversations table
      const { error: convError } = await supabase
        .from('chat_conversations')
        .select('id')
        .limit(1);
      
      if (convError) {
        console.error('Chat conversations access test failed:', convError);
        setSubscriptionStatus('error');
        return;
      }
      
      console.log('Chat tables access test successful');
      setSubscriptionStatus('connected');
      
    } catch (err) {
      console.error('Real-time connection test failed:', err);
      setSubscriptionStatus('error');
    }
  };

  const enableRealTime = async () => {
    console.log('Attempting to enable real-time...');
    try {
      // Test if real-time is already working by trying to subscribe
      const testSubscription = supabase
        .channel('test_realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
          },
          (payload) => {
            console.log('🎉 Test subscription received message:', payload);
            alert('Real-time is working! Received test message event.');
            supabase.removeChannel(testSubscription);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Real-time test subscription successful!');
            console.log('Waiting for message events... (send a message to test)');
          } else {
            console.log('❌ Real-time test failed with status:', status);
            alert('Real-time may not be properly configured. Please check:\n\n1. Run the migration in Supabase SQL Editor:\n   ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;\n   ALTER PUBLICATION supabase_realtime ADD TABLE chat_conversations;\n\n2. Ensure RLS policies allow access to chat tables\n\n3. Check Supabase project settings for real-time configuration');
          }
        });
    } catch (err) {
      console.error('Failed to test real-time:', err);
      alert('Error testing real-time connection. Please check the console for details.');
    }
  };

  // Test RLS policies
  const testRLSPolicies = async () => {
    console.log('Testing RLS policies...');
    try {
      // Test if we can query chat_messages
      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select('id, conversation_id, sender_id, content, created_at')
        .limit(5);
      
      if (messagesError) {
        console.error('❌ RLS policy test failed for chat_messages:', messagesError);
      } else {
        console.log('✅ RLS policy test passed for chat_messages:', messages?.length || 0, 'messages found');
        console.log('📋 Sample messages:', JSON.stringify(messages, null, 2));
      }

      // Test if we can query chat_conversations
      const { data: conversations, error: conversationsError } = await supabase
        .from('chat_conversations')
        .select('id, student_id, src_member_id')
        .limit(5);
      
      if (conversationsError) {
        console.error('❌ RLS policy test failed for chat_conversations:', conversationsError);
      } else {
        console.log('✅ RLS policy test passed for chat_conversations:', conversations?.length || 0, 'conversations found');
        console.log('📋 Sample conversations:', JSON.stringify(conversations, null, 2));
      }

    } catch (err) {
      console.error('Failed to test RLS policies:', err);
    }
  };

  const hasUnreadMessages = (conversation: ChatConversation) => {
    return getUnreadCount(conversation) > 0;
  };

  const handleNewMessage = (newMessage: { id: string; conversation_id: string; sender_id: string; content: string; created_at: string; is_read: boolean; sender_type?: string; message_type?: string }) => {
    console.log('Handling new message in conversation list:', newMessage);
    
    // Check if we've already processed this message ID
    if (processedMessageIds.current.has(newMessage.id)) {
      console.log('Message already processed, skipping:', newMessage.id);
      return;
    }
    
    // Add message ID to processed set
    processedMessageIds.current.add(newMessage.id);
    
    // Use ref to get the latest conversations state
    const currentConversations = conversationsRef.current;
    
    // Find the conversation this message belongs to
    const conversationIndex = currentConversations.findIndex(conv => conv.id === newMessage.conversation_id);
    
    if (conversationIndex !== -1) {
      // Update the conversation with the new message
      const updatedConversations = [...currentConversations];
      const conversation = updatedConversations[conversationIndex];
      
      if (conversation.messages) {
        // Check if message already exists to avoid duplicates
        const messageExists = conversation.messages.some(msg => msg.id === newMessage.id);
        
        if (!messageExists) {
          // Convert the newMessage to proper ChatMessage type
          const chatMessage: ChatMessage = {
            id: newMessage.id,
            conversation_id: newMessage.conversation_id,
            sender_type: (newMessage.sender_type as 'student' | 'src_member') || 'student',
            sender_id: newMessage.sender_id,
            content: newMessage.content,
            message_type: (newMessage.message_type as 'text' | 'image' | 'file') || 'text',
            created_at: newMessage.created_at,
            is_read: newMessage.is_read || false
          };
          
          // Add the new message to the conversation
          conversation.messages = [...conversation.messages, chatMessage];
          
          // Move this conversation to the top (most recent)
          const [movedConversation] = updatedConversations.splice(conversationIndex, 1);
          updatedConversations.unshift(movedConversation);
          
          setConversations(updatedConversations);
          conversationsRef.current = updatedConversations; // Update ref with new state
          onConversationsUpdate?.(updatedConversations); // Notify parent component of updates
          setHasNewMessages(true);
          console.log('Optimistically updated conversation with new message:', newMessage.id);
        } else {
          console.log('Message already exists in conversation, skipping duplicate');
        }
      } else {
        // If no messages array, refresh the conversations
        console.log('No messages array found, refreshing conversations');
        fetchConversations(true);
      }
    } else {
      // If conversation not found, refresh all conversations
      console.log('Conversation not found, refreshing all conversations');
      fetchConversations(true);
    }
  };

  const handleConversationSelect = async (conversation: ChatConversation) => {
    // Clear new messages flag when user interacts
    setHasNewMessages(false);
    
    // Mark messages as read if there are unread messages
    if (hasUnreadMessages(conversation)) {
      // Get the latest unread message to mark as the "last read"
      const latestUnreadMessage = getLatestUnreadMessage(conversation);
      
      // Optimistically update the UI first
      const updatedConversations = conversations.map(conv => {
        if (conv.id === conversation.id && conv.messages) {
          return {
            ...conv,
            messages: conv.messages.map(msg => ({
              ...msg,
              is_read: msg.sender_id !== currentUserId ? true : msg.is_read
            }))
          };
        }
        return conv;
      });
      setConversations(updatedConversations);
      conversationsRef.current = updatedConversations; // Update ref with new state
      onConversationsUpdate?.(updatedConversations); // Notify parent component of updates
      
      // Then mark messages as read in the backend
      await onMarkMessagesAsRead?.(conversation.id);
      
      console.log(`Marked conversation ${conversation.id} as read. Latest unread message was at: ${latestUnreadMessage?.created_at}`);
    }
    
    // Select the conversation
    onSelectConversation(conversation);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#359d49]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        <p>{error}</p>
        <button
          onClick={() => fetchConversations()}
          className="mt-2 text-sm text-[#359d49] hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>No conversations yet</p>
        <p className="text-sm">Start a chat with an SRC member to get help</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Connection Status Indicator */}
      {subscriptionStatus === 'connecting' && (
        <div className="p-2 mb-2 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-700 text-center">
            🔄 Connecting to real-time updates...
          </p>
        </div>
      )}
      {subscriptionStatus === 'error' && (
        <div className="p-2 mb-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 text-center">
            ⚠️ Real-time connection failed. Using polling fallback.
          </p>
        </div>
      )}
      {hasNewMessages && (
        <div className="p-2 mb-2 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700 text-center">
            📬 New messages received!
          </p>
        </div>
      )}
      {/* Debug: Manual refresh button - Only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-2 mb-2 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Status: {subscriptionStatus}
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => testRealTimeConnection()}
                className="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Test
              </button>
              <button
                onClick={() => enableRealTime()}
                className="text-xs px-2 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                Enable RT
              </button>
              <button
                onClick={() => testRLSPolicies()}
                className="text-xs px-2 py-1 bg-orange-500 text-white rounded hover:bg-orange-600"
              >
                Test RLS
              </button>
              <button
                onClick={() => fetchConversations(true)}
                className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-1">
        {conversations.map((conversation) => {
          const unreadCount = getUnreadCount(conversation);
          const lastMessage = conversation.messages?.[conversation.messages.length - 1];
          
          return (
                         <div
               key={conversation.id}
               onClick={() => handleConversationSelect(conversation)}
               className={`p-3 cursor-pointer rounded-lg transition-colors ${
                selectedConversationId === conversation.id
                  ? 'bg-[#359d49] text-white'
                  : 'hover:bg-gray-100'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-medium truncate ${
                        selectedConversationId === conversation.id ? 'text-white' : 'text-gray-900'
                      }`}>
                        {getConversationName(conversation)}
                      </h3>
                      {getConversationDepartment(conversation) && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className={`text-xs ${
                            selectedConversationId === conversation.id ? 'text-white/70' : 'text-gray-500'
                          }`}>
                            {getConversationDepartment(conversation)}
                          </span>
                        </div>
                      )}
                    </div>
                    {lastMessage && (
                      <span className={`text-xs ml-2 ${
                        selectedConversationId === conversation.id ? 'text-white/80' : 'text-gray-500'
                      }`}>
                        {formatTimestamp(lastMessage.created_at)}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm truncate mt-1 ${
                    selectedConversationId === conversation.id ? 'text-white/90' : 'text-gray-600'
                  } ${!conversation.messages || conversation.messages.length === 0 ? 'font-medium' : ''}`}>
                    {formatLastMessage(conversation)}
                  </p>
                </div>
                                 {unreadCount > 0 && (
                   <div className={`ml-2 flex-shrink-0 ${
                     selectedConversationId === conversation.id ? 'bg-white/20' : 'bg-[#359d49]'
                   } text-white text-xs rounded-full h-5 w-5 flex items-center justify-center`}>
                     {unreadCount > 9 ? '9+' : unreadCount}
                   </div>
                 )}
                 {(!conversation.messages || conversation.messages.length === 0) && (
                   <div className={`ml-2 flex-shrink-0 ${
                     selectedConversationId === conversation.id ? 'bg-white/20' : 'bg-blue-500'
                   } text-white text-xs rounded-full h-2 w-2`}>
                   </div>
                 )}
                 {conversation.messages && conversation.messages.length > 0 && unreadCount === 0 && (
                   <div className={`ml-2 flex-shrink-0 ${
                     selectedConversationId === conversation.id ? 'bg-white/20' : 'bg-gray-400'
                   } text-white text-xs rounded-full h-2 w-2`}>
                   </div>
                 )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 