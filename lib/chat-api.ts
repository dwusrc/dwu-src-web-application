// Chat API utility functions
export interface ChatConversation {
  id: string;
  student_id: string;
  src_member_id: string;
  created_at: string;
  updated_at: string;
  messages?: ChatMessage[];
  src_member?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
    role?: string;
    src_department?: string;
  };
  student?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
    department?: string;
    year_level?: number;
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
  is_read: boolean;
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
  src_department?: string;
  department?: string; // For students
  year_level?: number; // For students
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
      src_department?: string;
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

// SRC Department interfaces
export interface SrcDepartment {
  id: string;
  name: string;
  description: string;
  color: string;
  is_active: boolean;
  created_at: string;
}

export interface SrcDepartmentsResponse {
  departments: SrcDepartment[];
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

  // Create a new conversation (for students)
  async createConversation(srcMemberId: string): Promise<ChatConversation> {
    const response = await fetch(`${this.baseUrl}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ src_member_id: srcMemberId }),
    });

    if (response.status === 409) {
      // Conversation already exists, get the existing conversation
      const errorData = await response.json();
      if (errorData.conversation_id) {
        // Fetch the existing conversation
        const conversations = await this.getConversations();
        const existingConversation = conversations.find(conv => conv.id === errorData.conversation_id);
        if (existingConversation) {
          return existingConversation;
        }
      }
      throw new Error('Conversation already exists but could not be retrieved');
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create conversation');
    }

    const data = await response.json();
    return data.conversation;
  }

  // Create a new conversation with a student (for SRC members)
  async createConversationWithStudent(studentId: string): Promise<ChatConversation> {
    const response = await fetch(`${this.baseUrl}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ student_id: studentId }),
    });

    if (response.status === 409) {
      // Conversation already exists, get the existing conversation
      const errorData = await response.json();
      if (errorData.conversation_id) {
        // Fetch the existing conversation
        const conversations = await this.getConversations();
        const existingConversation = conversations.find(conv => conv.id === errorData.conversation_id);
        if (existingConversation) {
          return existingConversation;
        }
      }
      throw new Error('Conversation already exists but could not be retrieved');
    }

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

    const url = `${this.baseUrl}/messages?conversation_id=${conversationId}&${params}`;
    console.log(`🌐 API call: ${url}`);
    
    const response = await fetch(url);
    
    console.log(`🌐 API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`🌐 API error: ${response.status} - ${errorText}`);
      throw new Error(`Failed to fetch messages: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`🌐 API response data:`, data);
    return data;
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

  // Mark a message as read
  async markMessageAsRead(messageId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/messages/${messageId}/read`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to mark message as read');
    }
  }

  // Get all SRC departments
  async getSrcDepartments(): Promise<SrcDepartment[]> {
    const response = await fetch('/api/admin/departments');
    if (!response.ok) {
      throw new Error('Failed to fetch SRC departments');
    }
    const data: SrcDepartmentsResponse = await response.json();
    return data.departments;
  }

  // Get participants filtered by department
  async getParticipantsByDepartment(department?: string): Promise<ChatParticipant[]> {
    const params = new URLSearchParams();
    if (department) {
      params.append('department', department);
    }
    // Add role=student for SRC members to get students
    params.append('role', 'student');
    
    const response = await fetch(`${this.baseUrl}/participants?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch participants');
    }
    const data: ParticipantsResponse = await response.json();
    return data.participants;
  }

  // Clear all messages in a conversation
  async clearMessages(conversationId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/messages/clear`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ conversation_id: conversationId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to clear messages');
    }
  }
}

// Export a default instance
export const chatApi = new ChatApi(); 