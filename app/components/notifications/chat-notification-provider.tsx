'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ChatMessage, ChatConversation } from '@/lib/chat-api';
import { chatApi } from '@/lib/chat-api';

interface ChatNotification {
  id: string;
  title: string;
  message: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  isRead: boolean;
}

interface ChatNotificationContextType {
  notifications: ChatNotification[];
  unreadCount: number;
  totalUnreadMessages: number;
  markAsRead: (notificationId: string) => void;
  clearAllNotifications: () => void;
  isConnected: boolean;
}

const ChatNotificationContext = createContext<ChatNotificationContextType | undefined>(undefined);

export function useChatNotifications() {
  const context = useContext(ChatNotificationContext);
  if (!context) {
    throw new Error('useChatNotifications must be used within a ChatNotificationProvider');
  }
  return context;
}

interface ChatNotificationProviderProps {
  children: ReactNode;
  currentUserId: string;
  userRole?: 'student' | 'src' | 'admin';
}

export function ChatNotificationProvider({ 
  children, 
  currentUserId, 
  userRole = 'student' 
}: ChatNotificationProviderProps) {
  const [notifications, setNotifications] = useState<ChatNotification[]>([]);
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);

  // Fetch initial data
  useEffect(() => {
    if (currentUserId) {
      fetchConversationsAndUnreadCount();
      setupRealtimeSubscription();
    }
  }, [currentUserId]);

  const fetchConversationsAndUnreadCount = async () => {
    try {
      const data = await chatApi.getConversations();
      setConversations(data);
      
      // Calculate total unread messages
      let totalUnread = 0;
      const newNotifications: ChatNotification[] = [];

      data.forEach(conversation => {
        if (conversation.messages && conversation.messages.length > 0) {
          // Find unread messages from the other participant
          const unreadMessages = conversation.messages.filter(msg => 
            !msg.is_read && msg.sender_id !== currentUserId
          );

          totalUnread += unreadMessages.length;

          // Create notifications for recent unread messages (last 5)
          unreadMessages.slice(-5).forEach(msg => {
            const isStudent = userRole === 'student';
            const otherParticipant = isStudent ? conversation.src_member : conversation.student;
            
            newNotifications.push({
              id: `msg_${msg.id}`,
              title: 'New Message',
              message: msg.content.length > 50 ? `${msg.content.substring(0, 50)}...` : msg.content,
              conversationId: conversation.id,
              senderId: msg.sender_id,
              senderName: otherParticipant?.full_name || 'Unknown',
              timestamp: msg.created_at,
              isRead: false,
            });
          });
        }
      });

      setTotalUnreadMessages(totalUnread);
      setNotifications(newNotifications.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ));
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    console.log('🔔 Setting up chat notification subscription');
    
    const subscription = supabase
      .channel(`chat_notifications_${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        async (payload) => {
          const newMessage = payload.new as ChatMessage;
          
          // Only show notification if message is not from current user
          if (newMessage.sender_id !== currentUserId) {
            console.log('🔔 New message notification:', newMessage);
            
            // Fetch the conversation to get sender details
            try {
              const conversations = await chatApi.getConversations();
              const conversation = conversations.find(c => c.id === newMessage.conversation_id);
              
              if (conversation) {
                const isStudent = userRole === 'student';
                const sender = isStudent ? conversation.src_member : conversation.student;
                
                const notification: ChatNotification = {
                  id: `msg_${newMessage.id}`,
                  title: 'New Message',
                  message: newMessage.content.length > 50 
                    ? `${newMessage.content.substring(0, 50)}...` 
                    : newMessage.content,
                  conversationId: newMessage.conversation_id,
                  senderId: newMessage.sender_id,
                  senderName: sender?.full_name || 'Unknown',
                  timestamp: newMessage.created_at,
                  isRead: false,
                };

                setNotifications(prev => [notification, ...prev.slice(0, 19)]); // Keep last 20
                setTotalUnreadMessages(prev => prev + 1);
                
                // Show browser notification if permission granted
                if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification(`New message from ${notification.senderName}`, {
                    body: notification.message,
                    icon: '/favicon.ico',
                    tag: `chat_${newMessage.conversation_id}`,
                  });
                }
              }
            } catch (error) {
              console.error('Failed to fetch conversation for notification:', error);
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
        (payload) => {
          const updatedMessage = payload.new as ChatMessage;
          
          // If message was marked as read and it was from current user's conversation
          if (updatedMessage.is_read && updatedMessage.sender_id !== currentUserId) {
            setTotalUnreadMessages(prev => Math.max(0, prev - 1));
            setNotifications(prev => 
              prev.map(notif => 
                notif.id === `msg_${updatedMessage.id}` 
                  ? { ...notif, isRead: true }
                  : notif
              )
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('🔔 Notification subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      console.log('🔔 Cleaning up notification subscription');
      supabase.removeChannel(subscription);
    };
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <ChatNotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        totalUnreadMessages,
        markAsRead,
        clearAllNotifications,
        isConnected,
      }}
    >
      {children}
    </ChatNotificationContext.Provider>
  );
}
