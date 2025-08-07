'use client';

import { useState, useEffect, useRef } from 'react';
import { ChatConversationList } from './chat-conversation-list';
import { ChatMessageList } from './chat-message-list';
import { ChatInput } from './chat-input';
import { ChatSidebar } from './chat-sidebar';
import { ChatApi, ChatConversation, ChatParticipant, ChatMessage } from '@/lib/chat-api';
import { useSession } from '@/app/contexts/session-context';
import { supabase } from '@/lib/supabaseClient';

export default function SRCChatInterface() {
  const { session } = useSession();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [, setSelectedParticipant] = useState<ChatParticipant | null>(null);
  const [lastSentMessage, setLastSentMessage] = useState<ChatMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const processedMessageIds = useRef<Set<string>>(new Set());
  const conversationsRef = useRef<ChatConversation[]>([]);

  const chatApi = new ChatApi();

  // Get current SRC member's department
  const currentSrcDepartment = session?.user?.user_metadata?.src_department || 'General';

  // Fetch conversations for the current SRC member
  const fetchConversations = async (isRealTimeUpdate = false) => {
    try {
      // Only show loading spinner on initial load, not on real-time updates
      if (!isRealTimeUpdate) {
        setLoading(true);
      }
      
      const data = await chatApi.getConversations();
      
      // For SRC members, the API should already return only their conversations
      // No additional filtering needed since the API handles this
      setConversations(data);
      conversationsRef.current = data; // Update ref with latest conversations
      setError(null);
    } catch (err) {
      setError('Failed to load conversations');
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  // Real-time subscription setup (currently disabled)
  const _subscribeToMessageUpdates = () => {
    console.log('Setting up real-time subscription for SRC member:', session?.user?.id);
    
    // Prevent multiple subscriptions
    if (subscriptionRef.current) {
      console.log('Subscription already exists, skipping...');
      return;
    }
    
    try {
      const subscription = supabase
        .channel(`src_chat_updates_${session?.user?.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
          },
          (payload: { new: Record<string, unknown> }) => {
            console.log('New message received in SRC chat:', payload);
            const newMessage = payload.new as { id: string; conversation_id: string; sender_id: string; content: string; created_at: string; is_read: boolean; sender_type?: string; message_type?: string };
            
            // Only handle messages NOT from current SRC member
            if (newMessage.sender_id !== session?.user?.id) {
              // Check if this message belongs to one of the SRC member's conversations
              const isUserConversation = conversationsRef.current.some(conv => conv.id === newMessage.conversation_id);
              if (isUserConversation) {
                handleNewMessage(newMessage);
              } else {
                console.log('Message not from SRC conversation, refreshing all conversations');
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
            console.log('Message updated in SRC chat:', payload);
            const updatedMessage = payload.new;
            
            // Only handle updates on messages NOT from current SRC member
            if (updatedMessage.sender_id !== session?.user?.id) {
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
            console.log('New conversation created for SRC:', payload);
            // Refresh conversations when a new conversation is created
            fetchConversations(true);
          }
        )
        .subscribe((status) => {
          console.log('SRC chat subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to SRC chat real-time updates');
            setSubscriptionStatus('connected');
            // Clear any polling interval if real-time is working
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Failed to subscribe to SRC chat real-time updates');
            setSubscriptionStatus('error');
            subscriptionRef.current = null; // Clear the reference
            // Start polling as fallback
            startPollingFallback();
            // Try to reconnect after a delay
            setTimeout(() => {
              console.log('Attempting to reconnect to SRC real-time...');
              _subscribeToMessageUpdates();
            }, 5000);
          } else if (status === 'CLOSED') {
            console.log('SRC real-time connection closed, attempting to reconnect...');
            setSubscriptionStatus('connecting');
            subscriptionRef.current = null; // Clear the reference
            // Try to reconnect after a delay
            setTimeout(() => {
              console.log('Attempting to reconnect to SRC real-time...');
              _subscribeToMessageUpdates();
            }, 3000);
          } else if (status === 'TIMED_OUT') {
            console.log('SRC real-time connection timed out, attempting to reconnect...');
            setSubscriptionStatus('connecting');
            subscriptionRef.current = null; // Clear the reference
            // Try to reconnect after a delay
            setTimeout(() => {
              console.log('Attempting to reconnect to SRC real-time...');
              _subscribeToMessageUpdates();
            }, 3000);
          }
        });

      subscriptionRef.current = subscription;
    } catch (error) {
      console.error('Error setting up SRC real-time subscription:', error);
      setSubscriptionStatus('error');
      // Start polling as fallback
      startPollingFallback();
    }
  };

  const unsubscribeFromMessageUpdates = () => {
    if (subscriptionRef.current) {
      console.log('Unsubscribing from SRC real-time updates');
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
    console.log('Starting polling fallback for SRC conversation updates');
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    // Start with more frequent polling (every 2 seconds) for immediate feedback
    pollingIntervalRef.current = setInterval(() => {
      console.log('Polling for SRC conversation updates...');
      fetchConversations(true);
    }, 2000); // Poll every 2 seconds for immediate feedback
  };

  const handleNewMessage = (newMessage: { id: string; conversation_id: string; sender_id: string; content: string; created_at: string; is_read: boolean; sender_type?: string; message_type?: string }) => {
    console.log('Handling new message in SRC chat:', newMessage);
    console.log('Current conversations count:', conversationsRef.current.length);
    console.log('Message conversation ID:', newMessage.conversation_id);
    console.log('Available conversation IDs:', conversationsRef.current.map(c => c.id));
    
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
    
    console.log('Found conversation at index:', conversationIndex);
    
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
          console.log('Optimistically updated SRC conversation with new message:', newMessage.id);
        } else {
          console.log('Message already exists in SRC conversation, skipping duplicate');
        }
      } else {
        // If no messages array, refresh the conversations
        console.log('No messages array found, refreshing SRC conversations');
        fetchConversations(true);
      }
    } else {
      // If conversation not found, refresh all conversations
      console.log('Conversation not found, refreshing all SRC conversations');
      fetchConversations(true);
    }
  };

  // Keep conversationsRef in sync with conversations state
  useEffect(() => {
    conversationsRef.current = conversations;
    console.log('SRC conversations updated, ref now has:', conversations.length, 'conversations');
  }, [conversations]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchConversations();
      // Disable SRC dashboard's own real-time subscription since ChatConversationList handles it
      // subscribeToMessageUpdates();
      // startPollingFallback(); // Start polling as fallback
    }
    
    return () => {
      unsubscribeFromMessageUpdates();
    };
  }, [session?.user?.id]);

  const handleSelectConversation = (conversation: ChatConversation) => {
    setSelectedConversationId(conversation.id);
    setSelectedParticipant(null);
    setLastSentMessage(null);
    setShowSidebar(false); // Close sidebar on mobile when selecting conversation
  };

  const handleSelectParticipant = async (participant: ChatParticipant) => {
    setSelectedParticipant(participant);
    setSelectedConversationId(null);
    setLastSentMessage(null);
    
    // Create a new conversation with this student
    try {
      setIsCreatingConversation(true);
      const newConversation = await chatApi.createConversationWithStudent(participant.id);
      setConversations(prev => {
        const updatedConversations = [newConversation, ...prev];
        conversationsRef.current = updatedConversations; // Update ref with new state
        return updatedConversations;
      });
      setSelectedConversationId(newConversation.id);
      setSelectedParticipant(null);
      setShowSidebar(false); // Close sidebar on mobile when creating conversation
    } catch (error) {
      console.error('Failed to create conversation:', error);
    } finally {
      setIsCreatingConversation(false);
    }
  };

  const handleMessageSent = (message?: ChatMessage) => {
    if (message) {
      setLastSentMessage(message);
      // Remove the manual refresh since real-time should handle this
      // fetchConversations(true);
    }
  };

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#359d49] mx-auto mb-2"></div>
          <p className="text-gray-600">Loading your conversations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">{error}</p>
                    <button
            onClick={() => fetchConversations()}
            className="px-4 py-2 bg-[#359d49] text-white rounded-md hover:bg-[#2a6b39]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col lg:flex-row bg-white rounded-lg shadow-lg overflow-hidden" style={{ minHeight: '600px', maxHeight: '80vh' }}>
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b bg-white">
        <h2 className="text-lg font-semibold text-gray-900">Student Chat Management</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Sidebar - Hidden on mobile unless toggled */}
      <div className={`${
        showSidebar ? 'block' : 'hidden'
      } lg:block lg:w-80 border-r bg-gray-50`}>
        <div className="p-4 border-b bg-white">
          <h3 className="text-lg font-semibold text-gray-900">
            Students
          </h3>
          <p className="text-sm text-gray-600">
            {currentSrcDepartment} Department
          </p>
        </div>
        <ChatSidebar
          onSelectParticipant={handleSelectParticipant}
          currentUserId={session?.user?.id || ''}
          role="src"
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Desktop Header */}
        <div className="hidden lg:flex items-center justify-between p-4 border-b bg-white">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Student Chat Management</h2>
            <p className="text-sm text-gray-600">{currentSrcDepartment} Department</p>
          </div>
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Chat Content */}
        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Conversations List - Hidden on mobile when conversation is selected */}
          <div className={`${
            selectedConversation ? 'hidden' : 'block'
          } lg:block lg:w-80 border-r`}>
            <div className="p-4 border-b bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">
                Your Conversations
              </h3>
              <p className="text-sm text-gray-600">
                {currentSrcDepartment} Department
              </p>
              {/* Real-time Status Indicator */}
              {subscriptionStatus === 'connecting' && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-700 text-center">
                    🔄 Connecting to real-time updates...
                  </p>
                </div>
              )}
              {subscriptionStatus === 'error' && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-700 text-center">
                    ⚠️ Real-time connection failed. Using polling fallback.
                  </p>
                </div>
              )}
              {subscriptionStatus === 'connected' && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs text-green-700 text-center">
                    ✅ Real-time updates active
                  </p>
                </div>
              )}
              
              
            </div>
            <ChatConversationList
              selectedConversationId={selectedConversationId || undefined}
              onSelectConversation={handleSelectConversation}
              currentUserId={session?.user?.id || ''}
              userRole="src"
            />
          </div>

                     {/* Messages and Input */}
           <div className={`${
             selectedConversation ? 'block' : 'hidden'
           } lg:block lg:flex-1 flex flex-col min-h-0`}>
             {selectedConversation ? (
               <div className="flex-1 flex flex-col min-h-0">
                 <ChatMessageList
                   conversation={selectedConversation || null}
                   lastSentMessage={lastSentMessage}
                   currentUserId={session?.user?.id || ''}
                   userRole="src"
                 />
                 <ChatInput
                   conversation={selectedConversation || null}
                   onMessageSent={handleMessageSent}
                 />
               </div>
             ) : (
               /* Welcome Screen */
               <div className="flex-1 flex items-center justify-center">
                 <div className="text-center">
                   <div className="w-16 h-16 bg-[#359d49] rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4">
                     💬
                   </div>
                   <h3 className="text-lg font-medium text-gray-900 mb-2">
                     Welcome to Student Chat Management
                   </h3>
                   <p className="text-gray-600 mb-4">
                     Select a conversation from the left or start a new chat with a student
                   </p>
                   <p className="text-sm text-gray-500">
                                           You&apos;re managing the <strong>{currentSrcDepartment}</strong> department
                   </p>
                 </div>
               </div>
             )}
           </div>
        </div>

        {/* Mobile Back Button */}
        {selectedConversation && (
          <div className="lg:hidden p-4 border-t bg-white">
            <button
              onClick={() => setSelectedConversationId(null)}
              className="flex items-center text-[#359d49] hover:text-[#2d7d3d]"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Conversations
            </button>
          </div>
        )}
      </div>

      {/* Loading Overlay for Creating Conversation */}
      {isCreatingConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#359d49]"></div>
            <span>Creating conversation...</span>
          </div>
        </div>
      )}
    </div>
  );
} 