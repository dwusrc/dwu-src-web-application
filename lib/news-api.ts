import { NewsPost, NewsCategory, PostStatus } from '@/types/supabase';

// News Categories API
export const newsCategoriesApi = {
  // Get all active categories
  async getCategories(): Promise<NewsCategory[]> {
    const response = await fetch('/api/news/categories');
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
    const data = await response.json();
    return data.categories;
  },

  // Create new category (admin only)
  async createCategory(category: { name: string; description?: string; color?: string }): Promise<NewsCategory> {
    const response = await fetch('/api/news/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    });
    if (!response.ok) {
      throw new Error('Failed to create category');
    }
    const data = await response.json();
    return data.category;
  },
};

// News Posts API
export const newsPostsApi = {
  // Get posts with optional filters
  async getPosts(params?: {
    category?: string;
    featured?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<NewsPost[]> {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append('category', params.category);
    if (params?.featured !== undefined) searchParams.append('featured', params.featured.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());

    const response = await fetch(`/api/news/posts?${searchParams.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch posts');
    }
    const data = await response.json();
    return data.posts;
  },

  // Get single post by ID
  async getPost(id: string): Promise<NewsPost> {
    const response = await fetch(`/api/news/posts/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch post');
    }
    const data = await response.json();
    return data.post;
  },

  // Create new post
  async createPost(post: {
    title: string;
    content: string;
    excerpt?: string;
    category_id?: string;
    status?: PostStatus;
    featured?: boolean;
    image_url?: string;
    tags?: string[];
    allow_comments?: boolean;
  }): Promise<NewsPost> {
    const response = await fetch('/api/news/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(post),
    });
    if (!response.ok) {
      throw new Error('Failed to create post');
    }
    const data = await response.json();
    return data.post;
  },

  // Update post
  async updatePost(id: string, updates: Partial<NewsPost>): Promise<NewsPost> {
    const response = await fetch(`/api/news/posts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      throw new Error('Failed to update post');
    }
    const data = await response.json();
    return data.post;
  },

  // Delete post
  async deletePost(id: string): Promise<void> {
    const response = await fetch(`/api/news/posts/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete post');
    }
  },
};

// Image Upload API
export const imageUploadApi = {
  // Get signed upload URL for news images
  async getUploadUrl(fileName: string, fileType: string): Promise<{ signedUrl: string; path: string }> {
    const response = await fetch('/api/news/upload-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName, fileType }),
    });
    if (!response.ok) {
      throw new Error('Failed to get upload URL');
    }
    return await response.json();
  },

  // Upload image to Supabase Storage
  async uploadImage(file: File): Promise<string> {
    const { signedUrl, path } = await this.getUploadUrl(file.name, file.type);
    
    const uploadResponse = await fetch(signedUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload image');
    }

    // Return the public URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return `${supabaseUrl}/storage/v1/object/public/news-images/${path}`;
  },
}; 