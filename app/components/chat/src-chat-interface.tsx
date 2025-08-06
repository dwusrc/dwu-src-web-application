'use client';

import { useState, useEffect } from 'react';
import { ChatConversationList } from './chat-conversation-list';
import { ChatMessageList } from './chat-message-list';
import { ChatInput } from './chat-input';
import { ChatSidebar } from './chat-sidebar';
import { ChatApi, ChatConversation, ChatParticipant, ChatMessage } from '@/lib/chat-api';
import { useSession } from '@/app/contexts/session-context';

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

  const chatApi = new ChatApi();

  // Get current SRC member's department
  const currentSrcDepartment = session?.user?.user_metadata?.src_department || 'General';

  // Fetch conversations for the current SRC member
  const fetchConversations = async () => {
    try {
      setLoading(true);
      const data = await chatApi.getConversations();
      // Filter conversations to only show those where the SRC member is involved
      const filteredConversations = data.filter(conversation => 
        conversation.src_member?.id === session?.user?.id
      );
      setConversations(filteredConversations);
    } catch (err) {
      setError('Failed to load conversations');
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchConversations();
    }
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
      setConversations(prev => [newConversation, ...prev]);
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
      // Don't refresh conversations - let real-time updates handle it
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
            onClick={fetchConversations}
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
            </div>
            <ChatConversationList
              selectedConversationId={selectedConversationId || undefined}
              onSelectConversation={handleSelectConversation}
              currentUserId={session?.user?.id || ''}
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
                 />
                 <ChatInput
                   conversation={selectedConversation || null}
                   onMessageSent={handleMessageSent}
                   currentUserId={session?.user?.id || ''}
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