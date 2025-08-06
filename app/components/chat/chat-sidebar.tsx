'use client';

import { useState, useEffect } from 'react';
import { ChatParticipant } from '@/lib/chat-api';
import { chatApi } from '@/lib/chat-api';

interface ChatSidebarProps {
  onSelectParticipant: (participant: ChatParticipant) => void;
  currentUserId: string;
}

export function ChatSidebar({
  onSelectParticipant,
  currentUserId,
}: ChatSidebarProps) {
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchParticipants();
  }, []);

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      const data = await chatApi.getParticipants();
      // Filter out current user
      const filteredParticipants = data.filter(p => p.id !== currentUserId);
      setParticipants(filteredParticipants);
      setError(null);
    } catch (err) {
      setError('Failed to load SRC members');
      console.error('Error fetching participants:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredParticipants = participants.filter(participant =>
    participant.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    participant.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          onClick={fetchParticipants}
          className="mt-2 text-sm text-[#359d49] hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <h3 className="font-medium text-gray-900">SRC Members</h3>
        <p className="text-sm text-gray-500">Start a conversation</p>
      </div>

      {/* Search */}
      <div className="p-4 border-b">
        <input
          type="text"
          placeholder="Search SRC members..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#359d49] focus:border-transparent"
        />
      </div>

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto">
        {filteredParticipants.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchTerm ? 'No SRC members found' : 'No SRC members available'}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredParticipants.map((participant) => (
              <div
                key={participant.id}
                onClick={() => onSelectParticipant(participant)}
                className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-[#359d49] rounded-full flex items-center justify-center text-white font-medium">
                    {participant.full_name.charAt(0)}
                  </div>
                  <div className="ml-3 flex-1">
                    <h4 className="font-medium text-gray-900">
                      {participant.full_name}
                    </h4>
                    {participant.role && (
                      <p className="text-sm text-gray-500">{participant.role}</p>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 