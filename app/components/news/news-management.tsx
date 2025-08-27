'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { NewsPost, NewsCategory, PostStatus } from '@/types/supabase';
import { newsPostsApi, newsCategoriesApi, imageUploadApi } from '@/lib/news-api';
import { Button } from '@/app/components/ui/button';



export default function NewsManagement() {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<NewsPost | null>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [postsData, categoriesData] = await Promise.all([
        newsPostsApi.getPosts({ limit: 50 }),
        newsCategoriesApi.getCategories()
      ]);
      setPosts(postsData);
      setCategories(categoriesData);
    } catch {
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (postData: {
    title: string;
    content: string;
    excerpt?: string;
    category_id?: string;
    status?: PostStatus;
    featured?: boolean;
    image_url?: string;
    tags?: string[];
    allow_comments?: boolean;
  }) => {
    try {
      const newPost = await newsPostsApi.createPost(postData);
      setPosts(prev => [newPost, ...prev]);
      setShowCreateModal(false);
    } catch {
      alert('Failed to create post');
    }
  };

  const handleUpdatePost = async (id: string, updates: Partial<NewsPost>) => {
    try {
      const updatedPost = await newsPostsApi.updatePost(id, updates);
      setPosts(prev => prev.map(post => post.id === id ? updatedPost : post));
      setShowEditModal(false);
      setSelectedPost(null);
    } catch {
      alert('Failed to update post');
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await newsPostsApi.deletePost(id);
      setPosts(prev => prev.filter(post => post.id !== id));
    } catch {
      alert('Failed to delete post');
    }
  };

  const filteredPosts = posts.filter(post => {
    if (filter === 'all') return true;
    if (filter === 'published') return post.status === 'published';
    if (filter === 'draft') return post.status === 'draft';
    if (filter === 'archived') return post.status === 'archived';
    if (filter === 'featured') return post.featured;
    return true;
  });

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return 'Uncategorized';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Uncategorized';
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      published: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors] || statusColors.draft}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#359d49]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">News Management</h2>
          <p className="text-gray-600">Manage news posts and announcements</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 sm:items-center">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#359d49] hover:bg-[#2a6b39] text-white w-full sm:w-auto"
          >
            Create New Post
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49] sm:w-auto"
        >
          <option value="all">All Posts</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
          <option value="archived">Archived</option>
          <option value="featured">Featured</option>
        </select>
        <span className="text-sm text-gray-600">
          {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Posts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Featured
                </th>
                <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Views
                </th>
                <th className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPosts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-6 py-4">
                    <div className="flex items-center">
                      {post.image_url && (
                        <div className="relative h-10 w-10 mr-3">
                          <Image
                            src={post.image_url}
                            alt={post.title}
                            fill
                            className="rounded-lg object-cover"
                          />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {post.title}
                        </div>
                        {post.excerpt && (
                          <div className="text-sm text-gray-500 truncate">
                            {post.excerpt}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 md:hidden">
                          Category: {getCategoryName(post.category_id)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-3 sm:px-6 py-4 text-sm text-gray-900">
                    {getCategoryName(post.category_id)}
                  </td>
                  <td className="px-3 sm:px-6 py-4">
                    {getStatusBadge(post.status)}
                  </td>
                  <td className="hidden sm:table-cell px-3 sm:px-6 py-4">
                    {post.featured ? (
                      <span className="text-[#ddc753]">★ Featured</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>

                  <td className="hidden md:table-cell px-3 sm:px-6 py-4 text-sm text-gray-900">
                    {new Date(post.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-3 sm:px-6 py-4 text-sm font-medium text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        onClick={() => {
                          setSelectedPost(post);
                          setShowEditModal(true);
                        }}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDeletePost(post.id)}
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modals */}
      {showCreateModal && (
        <NewsPostModal
          categories={categories}
          onSubmit={handleCreatePost}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {showEditModal && selectedPost && (
        <NewsPostModal
          categories={categories}
          post={selectedPost}
          onSubmit={(updates) => handleUpdatePost(selectedPost.id, updates)}
          onClose={() => {
            setShowEditModal(false);
            setSelectedPost(null);
          }}
        />
      )}
    </div>
  );
}

// News Post Modal Component
interface NewsPostModalProps {
  categories: NewsCategory[];
  post?: NewsPost;
  onSubmit: (data: {
    title: string;
    content: string;
    excerpt?: string;
    category_id?: string;
    status?: PostStatus;
    featured?: boolean;
    image_url?: string;
    tags?: string[];
    allow_comments?: boolean;
  }) => void;
  onClose: () => void;
}

function NewsPostModal({ categories, post, onSubmit, onClose }: NewsPostModalProps) {
  const [formData, setFormData] = useState<{
    title: string;
    content: string;
    excerpt: string;
    category_id: string;
    status: PostStatus;
    featured: boolean;
    image_url: string;
    tags: string[];
    allow_comments: boolean;
  }>({
    title: post?.title || '',
    content: post?.content || '',
    excerpt: post?.excerpt || '',
    category_id: post?.category_id || '',
    status: post?.status || 'draft',
    featured: post?.featured || false,
    image_url: post?.image_url || '',
    tags: post?.tags || [],
    allow_comments: post?.allow_comments ?? true
  });
  const [uploading, setUploading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const imageUrl = await imageUploadApi.uploadImage(file);
      setFormData(prev => ({ ...prev, image_url: imageUrl }));
    } catch {
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">
            {post ? 'Edit Post' : 'Create New Post'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Excerpt
            </label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
              placeholder="Brief summary of the post..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Featured Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
                disabled={uploading}
              />
              {uploading && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
              {formData.image_url && (
                <div className="relative mt-2 h-20 w-20">
                  <Image
                    src={formData.image_url}
                    alt="Preview"
                    fill
                    className="object-cover rounded"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as PostStatus }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Featured Post</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.allow_comments}
                onChange={(e) => setFormData(prev => ({ ...prev, allow_comments: e.target.checked }))}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Allow Comments</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#359d49] hover:bg-[#2a6b39] text-white"
            >
              {post ? 'Update Post' : 'Create Post'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 