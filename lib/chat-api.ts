// Chat API utility functions
export interface ChatConversation {
  id: string;
  student_id: string;
  src_member_id: string;
  created_at: string;
  updated_at: string;
  src_member?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
  student?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_type: 'student' | 'src_member';
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file';
  created_at: string;
  sender_profile?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

export interface ChatParticipant {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  src_member_id: string; // This will be the member's ID
  role: string;
  created_at: string;
  has_conversation: boolean;
  conversation_id?: string;
}

export interface MessagesResponse {
  messages: ChatMessage[];
  total: number;
  hasMore: boolean;
  participants?: {
    src_member?: {
      id: string;
      full_name: string;
      email: string;
      avatar_url?: string;
    };
    student?: {
      id: string;
      full_name: string;
      email: string;
      avatar_url?: string;
    };
  };
}

export interface ConversationsResponse {
  conversations: ChatConversation[];
}

export interface ParticipantsResponse {
  participants: ChatParticipant[];
  total: number;
}

// Chat API class
export class ChatApi {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/chat';
  }

  // Get all conversations for the current user
  async getConversations(): Promise<ChatConversation[]> {
    const response = await fetch(`${this.baseUrl}/conversations`);
    if (!response.ok) {
      throw new Error('Failed to fetch conversations');
    }
    const data: ConversationsResponse = await response.json();
    return data.conversations;
  }

  // Create a new conversation
  async createConversation(srcMemberId: string): Promise<ChatConversation> {
    const response = await fetch(`${this.baseUrl}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ src_member_id: srcMemberId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create conversation');
    }

    const data = await response.json();
    return data.conversation;
  }

  // Get messages for a conversation
  async getMessages(
    conversationId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<MessagesResponse> {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());

    const response = await fetch(
      `${this.baseUrl}/messages?conversation_id=${conversationId}&${params}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }
    
    return await response.json();
  }

  // Get messages for a specific conversation by ID
  async getConversationMessages(
    conversationId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<MessagesResponse> {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());

    const response = await fetch(
      `${this.baseUrl}/conversations/${conversationId}/messages?${params}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch conversation messages');
    }
    
    return await response.json();
  }

  // Send a message
  async sendMessage(
    conversationId: string,
    content: string,
    messageType: 'text' | 'image' | 'file' = 'text'
  ): Promise<ChatMessage> {
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        content,
        message_type: messageType,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send message');
    }

    const data = await response.json();
    return data.message;
  }

  // Get available participants (SRC members for students)
  async getParticipants(): Promise<ChatParticipant[]> {
    const response = await fetch(`${this.baseUrl}/participants`);
    if (!response.ok) {
      throw new Error('Failed to fetch participants');
    }
    const data: ParticipantsResponse = await response.json();
    return data.participants;
  }
}

// Export a default instance
export const chatApi = new ChatApi(); 