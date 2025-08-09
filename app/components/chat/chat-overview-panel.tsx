'use client';

import { useState, useEffect } from 'react';
import { useChatNotifications } from '@/app/components/notifications/chat-notification-provider';
import { UnreadBadge } from '@/app/components/notifications/unread-badge';
import { chatApi, ChatConversation } from '@/lib/chat-api';

interface ChatOverviewPanelProps {
  currentUserId: string;
  onOpenChat?: () => void;
  onSelectConversation?: (conversationId: string) => void;
}

export function ChatOverviewPanel({ 
  currentUserId, 
  onOpenChat,
  onSelectConversation 
}: ChatOverviewPanelProps) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConversations, setActiveConversations] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const { totalUnreadMessages, notifications, isConnected } = useChatNotifications();

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const data = await chatApi.getConversations();
      setConversations(data);
      
      // Calculate statistics
      const active = data.filter(conv => 
        conv.messages && conv.messages.length > 0 && 
        new Date(conv.updated_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      ).length;
      
      setActiveConversations(active);
      setTotalStudents(data.length);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUnreadCount = (conversation: ChatConversation) => {
    if (!conversation.messages) return 0;
    return conversation.messages.filter(msg => 
      !msg.is_read && msg.sender_id !== currentUserId
    ).length;
  };

  const formatLastMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const recentConversations = conversations
    .filter(conv => conv.messages && conv.messages.length > 0)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-[#359d49] text-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Chat Overview</h3>
          <div className="flex items-center space-x-2">
            {/* Connection Status */}
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-300' : 'bg-yellow-300 animate-pulse'}`} 
                 title={isConnected ? 'Connected' : 'Reconnecting...'} />
            <button
              onClick={onOpenChat}
              className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-md text-sm transition-colors"
            >
              Open Full Chat
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="p-4 border-b border-gray-200">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#359d49]">{totalUnreadMessages}</div>
            <div className="text-xs text-gray-600">Unread Messages</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{activeConversations}</div>
            <div className="text-xs text-gray-600">Active Chats</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{totalStudents}</div>
            <div className="text-xs text-gray-600">Total Students</div>
          </div>
        </div>
      </div>

      {/* Recent Conversations */}
      <div className="p-4">
        <h4 className="font-medium text-gray-900 mb-3">Recent Conversations</h4>
        
        {recentConversations.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-2.306-.306l-3.448 1.448a1 1 0 01-1.414-1.414l1.448-3.448A8.959 8.959 0 013 12a8 8 0 018-8 8 8 0 018 8z" />
            </svg>
            <p className="text-sm">No recent conversations</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentConversations.map((conversation) => {
              const unreadCount = getUnreadCount(conversation);
              const lastMessage = conversation.messages?.[conversation.messages.length - 1];
              const student = conversation.student;

              return (
                <div
                  key={conversation.id}
                  className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                  onClick={() => onSelectConversation?.(conversation.id)}
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    {student?.avatar_url ? (
                      <img 
                        src={student.avatar_url} 
                        alt={student.full_name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-medium text-gray-600">
                        {student?.full_name?.charAt(0) || '?'}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 ml-3 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {student?.full_name || 'Unknown Student'}
                      </p>
                      <div className="flex items-center space-x-1">
                        {unreadCount > 0 && (
                          <UnreadBadge count={unreadCount} size="sm" variant="chat" />
                        )}
                        {lastMessage && (
                          <span className="text-xs text-gray-500">
                            {formatLastMessageTime(lastMessage.created_at)}
                          </span>
                        )}
                      </div>
                    </div>
                    {lastMessage && (
                      <p className="text-xs text-gray-600 truncate mt-1">
                        {lastMessage.sender_id === currentUserId ? 'You: ' : ''}
                        {lastMessage.content}
                      </p>
                    )}
                    {student?.department && (
                      <p className="text-xs text-gray-500">
                        {student.department}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <div className="border-t border-gray-200 p-4">
          <h4 className="font-medium text-gray-900 mb-3">Recent Notifications</h4>
          <div className="space-y-2">
            {notifications.slice(0, 3).map((notification) => (
              <div
                key={notification.id}
                className={`p-2 rounded-lg text-sm ${
                  notification.isRead ? 'bg-gray-50 text-gray-600' : 'bg-blue-50 text-blue-800'
                }`}
              >
                <div className="font-medium">{notification.senderName}</div>
                <div className="truncate">{notification.message}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatLastMessageTime(notification.timestamp)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="border-t border-gray-200 p-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onOpenChat}
            className="px-3 py-2 bg-[#359d49] text-white text-sm rounded-md hover:bg-[#2a6b39] transition-colors"
          >
            Open Chat
          </button>
          <button
            onClick={fetchConversations}
            className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
