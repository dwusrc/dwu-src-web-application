'use client';

import { useState, useRef, useEffect } from 'react';
import { FloatingUnreadBadge } from '@/app/components/notifications/unread-badge';
import { useChatNotifications } from '@/app/components/notifications/chat-notification-provider';
import ChatInterface from '@/app/components/chat/chat-interface';

interface FloatingChatWidgetProps {
  currentUserId: string;
  userRole?: 'student' | 'src' | 'admin';
  onOpenFullChat?: () => void;
}

export function FloatingChatWidget({ 
  currentUserId, 
  userRole = 'student',
  onOpenFullChat
}: FloatingChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const { totalUnreadMessages, notifications, isConnected } = useChatNotifications();
  const widgetRef = useRef<HTMLDivElement>(null);

  // Close widget when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        if (isOpen && !isMinimized) {
          setIsMinimized(true);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, isMinimized]);

  const toggleWidget = () => {
    if (!isOpen) {
      setIsOpen(true);
      setIsMinimized(false);
    } else if (isMinimized) {
      setIsMinimized(false);
    } else {
      setIsMinimized(true);
    }
  };

  const closeWidget = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const openFullChat = () => {
    closeWidget();
    onOpenFullChat?.();
  };

  // Get recent notifications for preview
  const recentNotifications = notifications.slice(0, 3);

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative">
          <button
            onClick={toggleWidget}
            className={`
              w-14 h-14 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 
              ${isOpen 
                ? 'bg-[#359d49] text-white' 
                : 'bg-white text-[#359d49] border-2 border-[#359d49] hover:bg-[#359d49] hover:text-white'
              }
              ${!isConnected ? 'opacity-75' : ''}
            `}
            title={isOpen ? 'Close chat' : 'Open chat'}
          >
            {isOpen ? (
              <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-2.306-.306l-3.448 1.448a1 1 0 01-1.414-1.414l1.448-3.448A8.959 8.959 0 013 12a8 8 0 018-8 8 8 0 018 8z" />
              </svg>
            )}
          </button>

          {/* Unread Badge */}
          <FloatingUnreadBadge
            count={totalUnreadMessages}
            variant="chat"
            size="md"
            position="top-right"
          />

          {/* Connection Status Indicator */}
          {!isConnected && (
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-yellow-400 border-2 border-white rounded-full animate-pulse" 
                 title="Reconnecting..." />
          )}
        </div>
      </div>

      {/* Chat Widget Panel */}
      {isOpen && (
        <div 
          ref={widgetRef}
          className={`
            fixed bottom-24 right-6 z-40 transition-all duration-300 transform
            ${isMinimized 
              ? 'w-80 h-16' 
              : 'w-96 h-[500px]'
            }
          `}
        >
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden h-full flex flex-col">
            {/* Header */}
            <div className="bg-[#359d49] text-white p-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-2.306-.306l-3.448 1.448a1 1 0 01-1.414-1.414l1.448-3.448A8.959 8.959 0 013 12a8 8 0 018-8 8 8 0 018 8z" />
                </svg>
                <h3 className="font-medium text-sm">
                  {userRole === 'student' ? 'Chat with SRC' : 'Student Chats'}
                </h3>
                {totalUnreadMessages > 0 && (
                  <span className="bg-white text-[#359d49] px-2 py-1 rounded-full text-xs font-medium">
                    {totalUnreadMessages}
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-1">
                {/* Minimize/Maximize Button */}
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1 hover:bg-white/20 rounded"
                  title={isMinimized ? 'Expand' : 'Minimize'}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isMinimized ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 14l9-9 3 3L9 18l-2-2z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    )}
                  </svg>
                </button>

                {/* Full Screen Button */}
                <button
                  onClick={openFullChat}
                  className="p-1 hover:bg-white/20 rounded"
                  title="Open full chat"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>

                {/* Close Button */}
                <button
                  onClick={closeWidget}
                  className="p-1 hover:bg-white/20 rounded"
                  title="Close"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            {!isMinimized && (
              <div className="flex-1 flex flex-col">
                {recentNotifications.length > 0 ? (
                  <div className="flex-1 overflow-hidden">
                    <ChatInterface
                      currentUserId={currentUserId}
                      userRole={userRole}
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-4">
                    <div className="text-center text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-2.306-.306l-3.448 1.448a1 1 0 01-1.414-1.414l1.448-3.448A8.959 8.959 0 013 12a8 8 0 018-8 8 8 0 018 8z" />
                      </svg>
                      <p className="text-sm">No recent messages</p>
                      <p className="text-xs mt-1">Start a conversation with SRC members</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Minimized Content */}
            {isMinimized && (
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600">
                    {totalUnreadMessages > 0 
                      ? `${totalUnreadMessages} new message${totalUnreadMessages > 1 ? 's' : ''}`
                      : 'Chat ready'
                    }
                  </span>
                </div>
                <button
                  onClick={openFullChat}
                  className="text-xs text-[#359d49] hover:underline"
                >
                  Open full chat
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
