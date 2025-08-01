// TypeScript types for Supabase tables

export type UserRole = 'student' | 'src' | 'admin';
export type PostStatus = 'draft' | 'published' | 'archived';
export type ComplaintCategory = 'academic' | 'facilities' | 'security' | 'health' | 'transport' | 'other';
export type ComplaintPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ComplaintStatus = 'pending' | 'in_progress' | 'resolved' | 'closed' | 'rejected';
export type ProposalStatus = 'pending' | 'under_review' | 'approved' | 'rejected';
export type ForumCategory = 'general' | 'academic' | 'events' | 'suggestions' | 'announcements';
export type MessageType = 'text' | 'image' | 'file';
export type NotificationType = 'complaint_update' | 'news_post' | 'forum_reply' | 'chat_message' | 'system';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  student_id?: string;
  role: UserRole;
  avatar_url?: string;
  department?: string;
  year_level?: number;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewsCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
  created_at: string;
}

export interface NewsPost {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  author_id?: string;
  category_id?: string;
  status: PostStatus;
  featured: boolean;
  image_url?: string;
  tags?: string[];
  view_count: number;
  allow_comments: boolean;
  created_at: string;
  updated_at: string;
  published_at: string;
}

export interface Complaint {
  id: string;
  student_id: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  assigned_to?: string;
  response?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export type ComplaintWithRelations = Complaint & {
  student?: {
    id: string;
    full_name: string;
    student_id?: string;
    department?: string;
    year_level?: number;
  };
  assigned_to?: {
    id: string;
    full_name: string;
    role: string;
  };
};

export interface ProjectProposal {
  id: string;
  student_id: string;
  title: string;
  description: string;
  objectives: string;
  budget?: number;
  timeline_months?: number;
  status: ProposalStatus;
  reviewed_by?: string;
  review_notes?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ForumTopic {
  id: string;
  title: string;
  content: string;
  author_id: string;
  category: ForumCategory;
  is_pinned: boolean;
  is_locked: boolean;
  view_count: number;
  reply_count: number;
  last_reply_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ForumReply {
  id: string;
  topic_id: string;
  author_id: string;
  content: string;
  parent_reply_id?: string;
  is_solution: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatConversation {
  id: string;
  student_id: string;
  src_member_id: string;
  is_active: boolean;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: MessageType;
  is_read: boolean;
  created_at: string;
}

export interface Report {
  id: string;
  title: string;
  description?: string;
  file_url: string;
  file_name: string;
  file_size?: number;
  month: number;
  year: number;
  uploaded_by?: string;
  download_count: number;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  reference_id?: string;
  reference_type?: string;
  is_read: boolean;
  created_at: string;
} 