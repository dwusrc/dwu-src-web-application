'use client';

import { useState } from 'react';
import { chatApi } from '@/lib/chat-api';

export default function TestChatPage() {
  const [results, setResults] = useState<Array<{
    test: string;
    result: { success: boolean; data?: unknown; error?: string };
    timestamp: string;
  }>>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (test: string, result: { success: boolean; data?: unknown; error?: string }) => {
    setResults(prev => [...prev, { test, result, timestamp: new Date().toISOString() }]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const testGetParticipants = async () => {
    setLoading(true);
    try {
      const participants = await chatApi.getParticipants();
      addResult('GET /api/chat/participants', { success: true, data: participants });
    } catch (error) {
      addResult('GET /api/chat/participants', { success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
    setLoading(false);
  };

  const testGetConversations = async () => {
    setLoading(true);
    try {
      const conversations = await chatApi.getConversations();
      addResult('GET /api/chat/conversations', { success: true, data: conversations });
    } catch (error) {
      addResult('GET /api/chat/conversations', { success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
    setLoading(false);
  };

  const testCreateConversation = async () => {
    setLoading(true);
    try {
      // First get participants to get a valid src_member_id
      const participants = await chatApi.getParticipants();
      if (participants.length === 0) {
        addResult('POST /api/chat/conversations', { success: false, error: 'No SRC members available' });
        setLoading(false);
        return;
      }

      const srcMemberId = participants[0].src_member_id;
      const conversation = await chatApi.createConversation(srcMemberId);
      addResult('POST /api/chat/conversations', { success: true, data: conversation });
    } catch (error) {
      addResult('POST /api/chat/conversations', { success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
    setLoading(false);
  };

  const testSendMessage = async () => {
    setLoading(true);
    try {
      // First get conversations to get a valid conversation_id
      const conversations = await chatApi.getConversations();
      if (conversations.length === 0) {
        addResult('POST /api/chat/messages', { success: false, error: 'No conversations available' });
        setLoading(false);
        return;
      }

      const conversationId = conversations[0].id;
      const message = await chatApi.sendMessage(conversationId, 'Test message from browser');
      addResult('POST /api/chat/messages', { success: true, data: message });
    } catch (error) {
      addResult('POST /api/chat/messages', { success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
    setLoading(false);
  };

  const testGetMessages = async () => {
    setLoading(true);
    try {
      // First get conversations to get a valid conversation_id
      const conversations = await chatApi.getConversations();
      if (conversations.length === 0) {
        addResult('GET /api/chat/messages', { success: false, error: 'No conversations available' });
        setLoading(false);
        return;
      }

      const conversationId = conversations[0].id;
      const messages = await chatApi.getConversationMessages(conversationId);
      addResult('GET /api/chat/messages', { success: true, data: messages });
    } catch (error) {
      addResult('GET /api/chat/messages', { success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Chat API Test Page</h1>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Instructions:</strong> This page tests the chat API endpoints. 
          Make sure you are logged in as a student to test all features.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={testGetParticipants}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Test Get Participants
        </button>
        
        <button
          onClick={testGetConversations}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          Test Get Conversations
        </button>
        
        <button
          onClick={testCreateConversation}
          disabled={loading}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
        >
          Test Create Conversation
        </button>
        
        <button
          onClick={testSendMessage}
          disabled={loading}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
        >
          Test Send Message
        </button>
        
        <button
          onClick={testGetMessages}
          disabled={loading}
          className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 disabled:opacity-50"
        >
          Test Get Messages
        </button>
        
        <button
          onClick={clearResults}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Clear Results
        </button>
      </div>

      {loading && (
        <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
          <p className="text-yellow-800">Loading...</p>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Test Results:</h2>
        {results.length === 0 ? (
          <p className="text-gray-500">No test results yet. Click a test button above.</p>
        ) : (
          results.map((result, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{result.test}</h3>
                <span className="text-sm text-gray-500">{result.timestamp}</span>
              </div>
              
              {result.result.success ? (
                <div className="bg-green-50 p-3 rounded">
                  <p className="text-green-800 font-medium">✅ Success</p>
                  <pre className="text-sm text-green-700 mt-2 overflow-auto">
                    {JSON.stringify(result.result.data, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="bg-red-50 p-3 rounded">
                  <p className="text-red-800 font-medium">❌ Failed</p>
                  <p className="text-red-700">{result.result.error}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
} 