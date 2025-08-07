'use client';

import { useState, useEffect, useRef } from 'react';
import { ChatMessage, ChatConversation } from '@/lib/chat-api';
import { chatApi } from '@/lib/chat-api';
import { supabase } from '@/lib/supabaseClient';

interface ChatMessageListProps {
  conversation: ChatConversation | null;
  currentUserId: string;
  userRole?: 'student' | 'src' | 'admin';
  onMessageSent?: () => void;
  lastSentMessage?: ChatMessage | null;
}

export function ChatMessageList({
  conversation,
  currentUserId,
  userRole = 'student',
  onMessageSent,
  lastSentMessage,
}: ChatMessageListProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null | undefined>(null);
  const processedMessageIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (conversation) {
      fetchMessages();
      subscriptionRef.current = subscribeToMessages();
    }
    
    return () => {
      // Cleanup subscription when component unmounts or conversation changes
      if (subscriptionRef.current) {
        unsubscribeFromMessages();
      }
    };
  }, [conversation?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const fetchMessages = async () => {
    if (!conversation) return;
    
    try {
      setLoading(true);
      const data = await chatApi.getMessages(conversation.id);
      setMessages(data.messages);
      setError(null);
    } catch (err) {
      setError('Failed to load messages');
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    if (!conversation) return;

    const subscription = supabase
      .channel(`chat_messages_${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          
          // Check if we've already processed this message ID
          if (processedMessageIds.current.has(newMessage.id)) {
            console.log('Message already processed in message list, skipping:', newMessage.id);
            return;
          }
          
          // Add message ID to processed set
          processedMessageIds.current.add(newMessage.id);
          
          setMessages(prev => {
            // Check if message already exists to prevent duplicates
            const messageExists = prev.some(msg => msg.id === newMessage.id);
            if (messageExists) {
              console.log('Message already exists, skipping duplicate:', newMessage.id);
              return prev;
            }
            console.log('Adding new message via real-time:', newMessage.id);
            return [...prev, newMessage];
          });
          
          // Mark message as read if it's not from current user
          if (newMessage.sender_id !== currentUserId) {
            markMessageAsRead(newMessage.id);
          }
          
          onMessageSent?.();
        }
      )
      .subscribe((status) => {
        console.log(`Message list subscription status for conversation ${conversation.id}:`, status);
        if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
          console.log('Message list subscription error, attempting to reconnect...');
          // Try to reconnect after a delay
          setTimeout(() => {
            if (conversation) {
              console.log('Reconnecting to message list...');
              subscriptionRef.current = subscribeToMessages();
            }
          }, 3000);
        }
      });

    return subscription;
  };

  const unsubscribeFromMessages = () => {
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }
    
    // Clear processed message IDs to prevent memory leaks
    processedMessageIds.current.clear();
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      await chatApi.markMessageAsRead(messageId);
    } catch (err) {
      console.error('Error marking message as read:', err);
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
      <div className="flex items-center p-4 border-b bg-white flex-shrink-0">
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

      {/* Messages - Fixed height with scroll */}
      <div 
        ref={messagesContainerRef}
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