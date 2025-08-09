'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage, ChatConversation } from '@/lib/chat-api';
import { chatApi } from '@/lib/chat-api';
import { supabase } from '@/lib/supabaseClient';

interface ChatMessageListProps {
  conversation: ChatConversation | null;
  currentUserId: string;
  userRole?: 'student' | 'src' | 'admin';
  onMessageSent?: () => void;
  lastSentMessage?: ChatMessage | null;
  forceRefresh?: boolean;
}

export function ChatMessageList({
  conversation,
  currentUserId,
  userRole = 'student',
  onMessageSent,
  lastSentMessage,
  forceRefresh = false,
}: ChatMessageListProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null | undefined>(null);
  const processedMessageIds = useRef<Set<string>>(new Set());
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageCountRef = useRef<number>(0);
  const reconnectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  const conversationIdRef = useRef<string | null>(null);

  // Memoize fetchMessages to prevent unnecessary re-renders
  const fetchMessages = useCallback(async () => {
    if (!conversation) return;
    
    // Prevent excessive API calls by checking if we recently fetched
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 1000) { // 1 second throttle
      console.log('🔄 Throttling fetchMessages call');
      return;
    }
    lastFetchTimeRef.current = now;
    
    try {
      setLoading(true);
      console.log(`📥 Fetching messages for conversation: ${conversation.id}`);
      
      // Fetch more messages to ensure we get all recent ones
      const data = await chatApi.getMessages(conversation.id, { limit: 200 });
      
      console.log(`📥 Received messages data:`, data);
      console.log(`📥 Messages count: ${data.messages?.length || 0}`);
      console.log(`📥 Total messages in conversation: ${data.total || 0}`);
      console.log(`📥 Has more messages: ${data.hasMore || false}`);
      
      if (data.messages && data.messages.length > 0) {
        console.log(`📥 First message:`, JSON.stringify(data.messages[0], null, 2));
        console.log(`📥 Last message:`, JSON.stringify(data.messages[data.messages.length - 1], null, 2));
      }
      
      setMessages(data.messages || []);
      lastMessageCountRef.current = data.messages?.length || 0; // Track message count for polling
      setError(null);
    } catch (err) {
      setError('Failed to load messages');
      console.error('❌ Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  }, [conversation?.id]);



  // Main effect for conversation changes - simplified dependencies
  useEffect(() => {
    if (conversation && conversation.id !== conversationIdRef.current) {
      console.log(`🔄 Conversation changed from ${conversationIdRef.current} to ${conversation.id}`);
      conversationIdRef.current = conversation.id;
      
      // Clear previous state
      setMessages([]);
      processedMessageIds.current.clear();
      lastMessageCountRef.current = 0;
      
      // Fetch messages
      fetchMessages();
      
      // Start polling immediately as a backup
      startPollingFallback();
      
      // Set up subscription with delay
      const subscriptionTimeout = setTimeout(() => {
        subscriptionRef.current = subscribeToMessages();
      }, 100);
      
      return () => {
        clearTimeout(subscriptionTimeout);
        if (subscriptionRef.current) {
          unsubscribeFromMessages();
        }
      };
    }
  }, [conversation?.id]); // Remove fetchMessages dependency to prevent excessive calls

  // Effect for force refresh
  useEffect(() => {
    if (forceRefresh && conversation) {
      console.log('🔄 Force refresh triggered');
      fetchMessages();
    }
  }, [forceRefresh]); // Remove fetchMessages dependency to prevent excessive calls

  // Simplified conversation monitoring - only check for significant changes
  useEffect(() => {
    if (conversation && conversation.messages && conversation.messages.length > 0) {
      const conversationMessageCount = conversation.messages.length;
      const currentMessageCount = messages.length;
      
      // Only fetch if there's a significant difference (more than 5 messages)
      if (Math.abs(conversationMessageCount - currentMessageCount) > 5) {
        console.log(`🔄 Significant message count difference detected: conversation has ${conversationMessageCount}, we have ${currentMessageCount}. Fetching fresh data...`);
        fetchMessages();
      }
    }
  }, [conversation?.messages?.length]); // Remove fetchMessages dependency to prevent excessive calls

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Debug effect to monitor messages state changes
  useEffect(() => {
    console.log('🔄 Messages state updated, count:', messages.length);
    if (messages.length > 0) {
      console.log('🔄 Latest message:', messages[messages.length - 1]);
    }
  }, [messages]);

  // Cleanup effect to ensure all subscriptions and polling are stopped on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up ChatMessageList component...');
      if (subscriptionRef.current) {
        unsubscribeFromMessages();
      }
      stopPollingFallback();
      stopPeriodicReconnection();
    };
  }, []);

  // Handle scroll events to show/hide scroll to bottom button
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    }
  };

  // Add last sent message to the list when it's available
  useEffect(() => {
    if (lastSentMessage && !messages.find(msg => msg.id === lastSentMessage.id)) {
      setMessages(prev => [...prev, lastSentMessage]);
      // Auto-scroll to bottom when new message is added
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [lastSentMessage, messages]);

  const subscribeToMessages = () => {
    if (!conversation) return;

    console.log(`🔌 Setting up message list real-time subscription for conversation: ${conversation.id}`);
    
    // Clean up any existing subscription first
    if (subscriptionRef.current) {
      console.log('Cleaning up existing subscription before creating new one');
      unsubscribeFromMessages();
    }
    
    // Create a more robust subscription that listens for all message changes
    const channelName = `chat_messages_${conversation.id}_${currentUserId}_${Date.now()}`;
    console.log(`🔌 Creating subscription with channel name: ${channelName}`);
    const subscription = supabase
      .channel(channelName) // Include user ID in channel name for better isolation
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          console.log('🎉 Message list received real-time INSERT event:', JSON.stringify(payload, null, 2));
          const newMessage = payload.new as ChatMessage;
          
          // Check if we've already processed this message ID
          if (processedMessageIds.current.has(newMessage.id)) {
            console.log('Message already processed in message list, skipping:', newMessage.id);
            return;
          }
          
          // Add message ID to processed set
          processedMessageIds.current.add(newMessage.id);
          
          console.log('🔄 About to update messages state with new message:', newMessage.id);
          console.log('🔄 Current messages count before update:', messages.length);
          console.log('🔄 New message sender_id:', newMessage.sender_id);
          console.log('🔄 Current user ID:', currentUserId);
          
          setMessages(prev => {
            // Check if message already exists to prevent duplicates
            const messageExists = prev.some(msg => msg.id === newMessage.id);
            if (messageExists) {
              console.log('Message already exists, skipping duplicate:', newMessage.id);
              return prev;
            }
            console.log('Adding new message via real-time:', newMessage.id);
            console.log('Previous messages count:', prev.length);
            const updatedMessages = [...prev, newMessage];
            console.log('Updated messages count:', updatedMessages.length);
            console.log('New message content:', newMessage.content);
            return updatedMessages;
          });
          
          // Mark message as read if it's not from current user
          if (newMessage.sender_id !== currentUserId) {
            markMessageAsRead(newMessage.id);
          }
          
          // Force a re-render by updating a dependency
          onMessageSent?.();
          
          // Auto-scroll to bottom after a short delay to ensure the message is rendered
          setTimeout(() => scrollToBottom(), 100);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          console.log('🔄 Message list received real-time UPDATE event:', JSON.stringify(payload, null, 2));
          const updatedMessage = payload.new as ChatMessage;
          
          setMessages(prev => {
            const messageIndex = prev.findIndex(msg => msg.id === updatedMessage.id);
            if (messageIndex !== -1) {
              const updatedMessages = [...prev];
              updatedMessages[messageIndex] = updatedMessage;
              return updatedMessages;
            }
            return prev;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_conversations',
          filter: `id=eq.${conversation.id}`,
        },
        (payload) => {
          console.log('🔄 Conversation updated via real-time:', JSON.stringify(payload, null, 2));
          // Trigger a refresh of messages when conversation is updated
          // This helps catch any messages that might have been missed
          setTimeout(() => {
            console.log('🔄 Triggering message refresh due to conversation update');
            fetchMessages();
          }, 1000);
        }
      )
              .subscribe((status) => {
          console.log(`Message list subscription status for conversation ${conversation.id} (user: ${currentUserId}):`, status);
          console.log(`Channel name: ${channelName}`);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Message list subscription successfully established');
          stopPollingFallback(); // Stop polling if subscription is successful
          stopPeriodicReconnection(); // Stop periodic reconnection if subscription is successful
        } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
          console.log('❌ Message list subscription error, attempting to reconnect...');
          startPollingFallback(); // Start polling on error
          startPeriodicReconnection(); // Start periodic reconnection attempts
        } else if (status === 'TIMED_OUT') {
          console.log('⏰ Message list subscription timed out, attempting to reconnect...');
          startPollingFallback(); // Start polling on timeout
          startPeriodicReconnection(); // Start periodic reconnection attempts
        }
      });

    return subscription;
  };

  const unsubscribeFromMessages = () => {
    if (subscriptionRef.current) {
      console.log('Unsubscribing from message list real-time updates');
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }
    
    // Clear processed message IDs to prevent memory leaks
    processedMessageIds.current.clear();
    
    // Stop polling if it's running
    stopPollingFallback();
    
    // Stop reconnection attempts
    stopPeriodicReconnection();
  };

  const startPollingFallback = () => {
    if (pollingIntervalRef.current) {
      console.log('Polling already active, skipping...');
      return;
    }
    
    console.log('🔄 Starting fallback polling for new messages...');
    setIsPolling(true);
    pollingIntervalRef.current = setInterval(async () => {
      if (!conversation) return;
      
      try {
        const data = await chatApi.getMessages(conversation.id, { limit: 200 });
        const currentCount = data.messages?.length || 0;
        
        if (currentCount > lastMessageCountRef.current) {
          console.log(`🔄 Polling detected ${currentCount - lastMessageCountRef.current} new messages`);
          setMessages(data.messages || []);
          lastMessageCountRef.current = currentCount;
          
          // If polling detected new messages, it means real-time might not be working
          // Try to re-establish the subscription
          if (subscriptionRef.current) {
            console.log('🔄 Real-time subscription might be broken, attempting to reconnect...');
            unsubscribeFromMessages();
            setTimeout(() => {
              if (conversation && !subscriptionRef.current) {
                subscriptionRef.current = subscribeToMessages();
              }
            }, 1000);
          }
        }
      } catch (err) {
        console.error('Error during polling fallback:', err);
      }
    }, 2000); // Check every 2 seconds for more responsive fallback
  };

  const stopPollingFallback = () => {
    if (pollingIntervalRef.current) {
      console.log('🔄 Stopping fallback polling');
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      setIsPolling(false);
    }
  };

  const startPeriodicReconnection = () => {
    if (reconnectionIntervalRef.current) {
      console.log('Reconnection already active, skipping...');
      return;
    }
    
    console.log('🔄 Starting periodic reconnection attempts...');
    reconnectionIntervalRef.current = setInterval(() => {
      if (!conversation) return;
      
      if (!subscriptionRef.current) {
        console.log('🔄 Attempting to reconnect to message list...');
        subscriptionRef.current = subscribeToMessages();
      }
    }, 10000); // Try to reconnect every 10 seconds
  };

  const stopPeriodicReconnection = () => {
    if (reconnectionIntervalRef.current) {
      console.log('🔄 Stopping periodic reconnection');
      clearInterval(reconnectionIntervalRef.current);
      reconnectionIntervalRef.current = null;
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      await chatApi.markMessageAsRead(messageId);
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  // Clear all messages in the conversation
  const clearAllMessages = async () => {
    if (!conversation) return;
    
    if (!confirm('Are you sure you want to delete all messages in this conversation? This action cannot be undone.')) {
      return;
    }
    
    try {
      setIsClearing(true);
      console.log(`🗑️ Clearing all messages for conversation: ${conversation.id}`);
      
      // Call the clear messages API
      await chatApi.clearMessages(conversation.id);
      
      // Clear local messages
      setMessages([]);
      lastMessageCountRef.current = 0;
      processedMessageIds.current.clear();
      
      console.log('✅ All messages cleared successfully');
    } catch (err) {
      console.error('❌ Error clearing messages:', err);
      alert('Failed to clear messages. Please try again.');
    } finally {
      setIsClearing(false);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest'
      });
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isOwnMessage = (message: ChatMessage) => {
    return message.sender_id === currentUserId;
  };

  // Helper function to get the correct conversation participant name
  const getConversationParticipantName = (conversation: ChatConversation) => {
    if (userRole === 'src') {
      // For SRC members, show the student's name
      return conversation.student?.full_name || 'Student';
    } else {
      // For students, show the SRC member's name
      return conversation.src_member?.full_name || 'SRC Member';
    }
  };

  // Helper function to get the conversation participant's initial
  const getConversationParticipantInitial = (conversation: ChatConversation) => {
    if (userRole === 'src') {
      // For SRC members, show the student's initial
      return conversation.student?.full_name?.charAt(0) || 'S';
    } else {
      // For students, show the SRC member's initial
      return conversation.src_member?.full_name?.charAt(0) || 'S';
    }
  };

  // Helper function to get the conversation participant's department
  const getConversationParticipantDepartment = (conversation: ChatConversation) => {
    if (userRole === 'src') {
      // For SRC members, show the student's department
      return conversation.student?.department;
    } else {
      // For students, show the SRC member's department
      return conversation.src_member?.src_department;
    }
  };

  // Helper function to get the conversation participant's year level (for students)
  const getConversationParticipantYearLevel = (conversation: ChatConversation) => {
    if (userRole === 'src') {
      // For SRC members, show the student's year level
      return conversation.student?.year_level;
    } else {
      // For students, no year level to show
      return null;
    }
  };

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>Select a conversation to start chatting</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#359d49]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-600">
        <div className="text-center">
          <p>{error}</p>
          <button
            onClick={fetchMessages}
            className="mt-2 text-sm text-[#359d49] hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Conversation Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white flex-shrink-0">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-[#359d49] rounded-full flex items-center justify-center text-white font-medium">
            {getConversationParticipantInitial(conversation)}
          </div>
          <div className="ml-3">
            <h3 className="font-medium text-gray-900">
              {getConversationParticipantName(conversation)}
            </h3>
            <div className="flex items-center gap-2">
              {getConversationParticipantYearLevel(conversation) && (
                <>
                  <span className="text-xs px-2 py-1 bg-[#359d49]/10 text-[#359d49] rounded-full">
                    Year {getConversationParticipantYearLevel(conversation)}
                  </span>
                  <span className="text-gray-300">•</span>
                </>
              )}
              {getConversationParticipantDepartment(conversation) && (
                <span className="text-xs px-2 py-1 bg-[#359d49] text-white rounded-full font-medium">
                  {getConversationParticipantDepartment(conversation)}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Polling Indicator */}
          {isPolling && (
            <div className="flex items-center px-2 py-1 text-xs text-blue-600 bg-blue-50 rounded-md">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
              Live
            </div>
          )}
          
          {/* Refresh Button */}
          <button
            onClick={fetchMessages}
            disabled={loading}
            className="flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh messages"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
            ) : (
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          
          {/* Clear Chats Button */}
          <button
            onClick={clearAllMessages}
            disabled={isClearing || messages.length === 0}
            className="flex items-center px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Clear all messages"
          >
            {isClearing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
            ) : (
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
            {isClearing ? 'Clearing...' : 'Clear Chat'}
          </button>
        </div>
      </div>

      {/* Messages - Fixed height with scroll */}
      <div 
        ref={messagesContainerRef}
        key={`messages-${messages.length}-${messages[messages.length - 1]?.id || 'empty'}`}
        className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 relative" 
        style={{ 
          maxHeight: 'calc(100vh - 300px)',
          scrollbarWidth: 'thin',
          scrollbarColor: '#d1d5db #f3f4f6'
        }}
        onScroll={handleScroll}
      >
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${isOwnMessage(message) ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  isOwnMessage(message)
                    ? 'bg-[#359d49] text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    isOwnMessage(message) ? 'text-white/70' : 'text-gray-500'
                  }`}
                >
                  {formatTimestamp(message.created_at)}
                  {message.is_read && isOwnMessage(message) && (
                    <span className="ml-1">✓</span>
                  )}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
        
        {/* Scroll to Bottom Button */}
        {showScrollButton && messages.length > 0 && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 bg-[#359d49] text-white p-2 rounded-full shadow-lg hover:bg-[#2d7d3d] transition-colors z-10"
            title="Scroll to bottom"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
} 