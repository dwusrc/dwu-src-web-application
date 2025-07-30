'use client';

import { useState, useEffect } from 'react';
import { NewsPost, NewsCategory } from '@/types/supabase';
import { newsPostsApi, newsCategoriesApi } from '@/lib/news-api';
import { Button } from '@/app/components/ui/button';

interface NewsDisplayProps {
  limit?: number;
  showFilters?: boolean;
  showPagination?: boolean;
  category?: string;
  featured?: boolean;
}

export default function NewsDisplay({
  limit = 10,
  showFilters = true,
  showPagination = true,
  category,
  featured
}: NewsDisplayProps) {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(category || 'all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, currentPage, limit]);

  const loadData = async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * limit;
      
      const postsData = await newsPostsApi.getPosts({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        featured: featured,
        limit,
        offset
      });
      
      setPosts(postsData);
      setTotalPosts(postsData.length); // In a real app, you'd get total count from API
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesData = await newsCategoriesApi.getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  useEffect(() => {
    if (showFilters) {
      loadCategories();
    }
  }, [showFilters]);

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return 'Uncategorized';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Uncategorized';
  };

  const getCategoryColor = (categoryId?: string) => {
    if (!categoryId) return '#6b7280';
    const category = categories.find(c => c.id === categoryId);
    return category?.color || '#6b7280';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const totalPages = Math.ceil(totalPosts / limit);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#359d49]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      {showFilters && (
        <div className="flex gap-4 items-center">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#359d49]"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-600">
            {posts.length} post{posts.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* News Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <NewsCard key={post.id} post={post} getCategoryName={getCategoryName} getCategoryColor={getCategoryColor} formatDate={formatDate} />
        ))}
      </div>

      {/* Empty State */}
      {posts.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📰</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No news posts found</h3>
          <p className="text-gray-600">
            {selectedCategory !== 'all' 
              ? `No posts in the "${selectedCategory}" category yet.`
              : 'No news posts have been published yet.'
            }
          </p>
        </div>
      )}

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="bg-[#359d49] hover:bg-[#2a6b39] text-white disabled:opacity-50"
          >
            Previous
          </Button>
          
          <span className="px-4 py-2 text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          
          <Button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="bg-[#359d49] hover:bg-[#2a6b39] text-white disabled:opacity-50"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

// News Card Component
interface NewsCardProps {
  post: NewsPost;
  getCategoryName: (categoryId?: string) => string;
  getCategoryColor: (categoryId?: string) => string;
  formatDate: (dateString: string) => string;
}

function NewsCard({ post, getCategoryName, getCategoryColor, formatDate }: NewsCardProps) {
  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Image */}
      {post.image_url && (
        <div className="aspect-video overflow-hidden">
          <img
            src={post.image_url}
            alt={post.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {/* Category Badge */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className="px-2 py-1 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: getCategoryColor(post.category_id) }}
          >
            {getCategoryName(post.category_id)}
          </span>
          {post.featured && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#ddc753] text-white">
              Featured
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
          {post.title}
        </h3>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-gray-600 mb-4 line-clamp-3">
            {post.excerpt}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-4">
            <span>{formatDate(post.created_at)}</span>
            <span>{post.view_count || 0} views</span>
          </div>
          
          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex gap-1">
              {post.tags.slice(0, 2).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                >
                  {tag}
                </span>
              ))}
              {post.tags.length > 2 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                  +{post.tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Read More Button */}
        <div className="mt-4">
          <Button
            className="w-full bg-[#359d49] hover:bg-[#2a6b39] text-white"
            onClick={() => window.open(`/news/${post.id}`, '_blank')}
          >
            Read More
          </Button>
        </div>
      </div>
    </article>
  );
} 