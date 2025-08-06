'use client';

import { useState, useEffect } from 'react';
import { ChatConversation } from '@/lib/chat-api';
import { chatApi } from '@/lib/chat-api';

interface ChatConversationListProps {
  onSelectConversation: (conversation: ChatConversation) => void;
  selectedConversationId?: string;
  currentUserId: string;
}

export function ChatConversationList({
  onSelectConversation,
  selectedConversationId,
  currentUserId,
}: ChatConversationListProps) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const data = await chatApi.getConversations();
      setConversations(data);
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
      return 'No messages yet';
    }
    
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    const isOwnMessage = lastMessage.sender_id === currentUserId;
    const prefix = isOwnMessage ? 'You: ' : '';
    
    return `${prefix}${lastMessage.content.substring(0, 50)}${lastMessage.content.length > 50 ? '...' : ''}`;
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
    return conversation.messages?.filter(
      msg => !msg.is_read && msg.sender_id !== currentUserId
    ).length || 0;
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
          onClick={fetchConversations}
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
        <p className="text-sm">Start a chat with an SRC member</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-1">
        {conversations.map((conversation) => {
          const unreadCount = getUnreadCount(conversation);
          const lastMessage = conversation.messages?.[conversation.messages.length - 1];
          
          return (
            <div
              key={conversation.id}
              onClick={() => onSelectConversation(conversation)}
              className={`p-3 cursor-pointer rounded-lg transition-colors ${
                selectedConversationId === conversation.id
                  ? 'bg-[#359d49] text-white'
                  : 'hover:bg-gray-100'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-medium truncate ${
                      selectedConversationId === conversation.id ? 'text-white' : 'text-gray-900'
                    }`}>
                      {conversation.src_member?.full_name || 'SRC Member'}
                    </h3>
                    {lastMessage && (
                      <span className={`text-xs ${
                        selectedConversationId === conversation.id ? 'text-white/80' : 'text-gray-500'
                      }`}>
                        {formatTimestamp(lastMessage.created_at)}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm truncate mt-1 ${
                    selectedConversationId === conversation.id ? 'text-white/90' : 'text-gray-600'
                  }`}>
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
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 