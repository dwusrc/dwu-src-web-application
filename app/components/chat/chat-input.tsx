'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatConversation, ChatMessage } from '@/lib/chat-api';
import { chatApi } from '@/lib/chat-api';

interface ChatInputProps {
  conversation: ChatConversation | null;
  onMessageSent?: (message?: ChatMessage) => void;
  disabled?: boolean;
}

export function ChatInput({
  conversation,
  onMessageSent,
  disabled = false,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!conversation || !message.trim() || isSending || disabled) {
      return;
    }

    const trimmedMessage = message.trim();
    setMessage('');
    setIsSending(true);
    setError(null);

          try {
            const sentMessage = await chatApi.sendMessage(conversation.id, trimmedMessage);
      
      // Manually trigger message update since real-time isn't working
      onMessageSent?.(sentMessage);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (err) {
      setError('Failed to send message');
      console.error('Error sending message:', err);
      // Restore message on error
      setMessage(trimmedMessage);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const isMessageValid = message.trim().length > 0;
  const canSend = isMessageValid && !isSending && !disabled && conversation;

  if (!conversation) {
    return (
      <div className="p-4 border-t bg-gray-50 text-center text-gray-500">
        <p>Select a conversation to start chatting</p>
      </div>
    );
  }

  return (
    <div className="border-t bg-white">
      {error && (
        <div className="px-4 py-2 bg-red-50 text-red-600 text-sm">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-800 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="p-4">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#359d49] focus:border-transparent"
              rows={1}
              maxLength={1000}
              disabled={disabled || isSending}
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-500">
                {message.length}/1000
              </span>
              <span className="text-xs text-gray-500">
                Press Enter to send, Shift+Enter for new line
              </span>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={!canSend}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              canSend
                ? 'bg-[#359d49] text-white hover:bg-[#2d7d3d]'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSending ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending...
              </div>
            ) : (
              'Send'
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 