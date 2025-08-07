'use client';

import { useState } from 'react';
import { ChatConversation, ChatParticipant, ChatMessage } from '@/lib/chat-api';
import { chatApi } from '@/lib/chat-api';
import { ChatConversationList } from './chat-conversation-list';
import { ChatMessageList } from './chat-message-list';
import { ChatInput } from './chat-input';
import { ChatSidebar } from './chat-sidebar';

interface ChatInterfaceProps {
  currentUserId: string;
  userRole?: 'student' | 'src' | 'admin';
}

function ChatInterface({ currentUserId, userRole }: ChatInterfaceProps) {
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [lastSentMessage, setLastSentMessage] = useState<ChatMessage | null>(null);

  const handleSelectConversation = (conversation: ChatConversation) => {
    setSelectedConversation(conversation);
    setShowSidebar(false);
    setLastSentMessage(null); // Reset last sent message when changing conversations
  };

  const handleMarkMessagesAsRead = async (conversationId: string) => {
    try {
      // Get all unread messages for this conversation
      const response = await chatApi.getMessages(conversationId);
      const unreadMessages = response.messages.filter(
        msg => !msg.is_read && msg.sender_id !== currentUserId
      );
      
      // Mark each unread message as read in parallel for better performance
      const markReadPromises = unreadMessages.map(message => 
        chatApi.markMessageAsRead(message.id)
      );
      
      await Promise.all(markReadPromises);
      
      console.log(`Marked ${unreadMessages.length} messages as read for conversation ${conversationId}`);
      
      // The real-time subscription will automatically update the UI
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleSelectParticipant = async (participant: ChatParticipant) => {
    try {
      setIsCreatingConversation(true);
      const newConversation = await chatApi.createConversation(participant.id);
      setSelectedConversation(newConversation);
      setShowSidebar(false);
      setLastSentMessage(null); // Reset last sent message when creating new conversation
    } catch (error) {
      console.error('Error creating conversation:', error);
    } finally {
      setIsCreatingConversation(false);
    }
  };

  const handleMessageSent = (message?: ChatMessage) => {
    if (message) {
      setLastSentMessage(message);
    }
    // Refresh conversation list to show updated last message
    // This will be handled by real-time updates
  };

  return (
    <div className="h-full flex flex-col lg:flex-row bg-white rounded-lg shadow-lg overflow-hidden" style={{ minHeight: '600px', maxHeight: '80vh' }}>
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b bg-white">
        <h2 className="text-lg font-semibold text-gray-900">Chat</h2>
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
        <ChatSidebar
          onSelectParticipant={handleSelectParticipant}
          currentUserId={currentUserId}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Desktop Header */}
        <div className="hidden lg:flex items-center justify-between p-4 border-b bg-white">
          <h2 className="text-lg font-semibold text-gray-900">Chat</h2>
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
            <ChatConversationList
              onSelectConversation={handleSelectConversation}
              selectedConversationId={selectedConversation?.id}
              currentUserId={currentUserId}
              userRole={userRole}
              onMarkMessagesAsRead={handleMarkMessagesAsRead}
            />
          </div>

          {/* Messages and Input */}
          <div className={`${
            selectedConversation ? 'block' : 'hidden'
          } lg:block lg:flex-1 flex flex-col min-h-0`}>
            <div className="flex-1 flex flex-col min-h-0">
              <ChatMessageList
                conversation={selectedConversation}
                currentUserId={currentUserId}
                userRole={userRole}
                onMessageSent={handleMessageSent}
                lastSentMessage={lastSentMessage}
              />
              <ChatInput
                conversation={selectedConversation}
                onMessageSent={handleMessageSent}
                disabled={isCreatingConversation}
              />
            </div>
          </div>
        </div>

        {/* Mobile Back Button */}
        {selectedConversation && (
          <div className="lg:hidden p-4 border-t bg-white">
            <button
              onClick={() => setSelectedConversation(null)}
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

export default ChatInterface; 