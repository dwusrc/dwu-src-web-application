'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
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
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * limit;
      
      const postsData = await newsPostsApi.getPosts({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        featured: featured,
        timePeriod: selectedTimePeriod !== 'all' ? selectedTimePeriod : undefined,
        search: searchQuery.trim() || undefined,
        limit,
        offset
      });
      
      setPosts(postsData);
      setTotalPosts(postsData.length); // In a real app, you'd get total count from API
    } catch {
      alert('Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedTimePeriod, searchQuery, currentPage, limit, featured]);

  const loadCategories = async () => {
    try {
      const categoriesData = await newsCategoriesApi.getCategories();
      setCategories(categoriesData);
    } catch {
      alert('Failed to load categories');
    }
  };

  useEffect(() => {
    if (showFilters) {
      loadCategories();
    }
  }, [showFilters]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== '') {
        setCurrentPage(1);
        loadData();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, loadData]);

  // Load data when other filters change
  useEffect(() => {
    if (searchQuery === '') {
      loadData();
    }
  }, [selectedCategory, selectedTimePeriod, currentPage, limit, loadData, searchQuery]);

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

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedTimePeriod('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const hasActiveFilters = selectedCategory !== 'all' || selectedTimePeriod !== 'all' || searchQuery.trim() !== '';

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#359d49]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Filters */}
      {showFilters && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search news posts..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#359d49] focus:border-[#359d49]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap gap-4 items-center">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#359d49] focus:border-[#359d49]"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>

            {/* Time Period Filter */}
            <select
              value={selectedTimePeriod}
              onChange={(e) => {
                setSelectedTimePeriod(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#359d49] focus:border-[#359d49]"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">Last 3 Months</option>
              <option value="year">This Year</option>
            </select>

            {/* Reset Filters Button */}
            {hasActiveFilters && (
              <Button
                onClick={resetFilters}
                variant="outline"
                className="text-gray-600 border-gray-300 hover:bg-gray-50"
              >
                Clear Filters
              </Button>
            )}

            {/* Results Count */}
            <span className="text-sm text-gray-600 ml-auto">
              {posts.length} post{posts.length !== 1 ? 's' : ''} found
            </span>
          </div>

          {/* Active Filter Tags */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-gray-600">Active filters:</span>
              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Category: {selectedCategory}
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              {selectedTimePeriod !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Time: {selectedTimePeriod === 'today' ? 'Today' : 
                         selectedTimePeriod === 'week' ? 'This Week' :
                         selectedTimePeriod === 'month' ? 'This Month' :
                         selectedTimePeriod === 'quarter' ? 'Last 3 Months' :
                         selectedTimePeriod === 'year' ? 'This Year' : selectedTimePeriod}
                  <button
                    onClick={() => setSelectedTimePeriod('all')}
                    className="ml-1 hover:bg-green-200 rounded-full p-0.5"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Search: &ldquo;{searchQuery}&rdquo;
                  <button
                    onClick={() => setSearchQuery('')}
                    className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* News Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <NewsCard key={post.id} post={post} getCategoryName={getCategoryName} getCategoryColor={getCategoryColor} formatDate={formatDate} />
        ))}
      </div>

      {/* Enhanced Empty State */}
      {posts.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📰</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No news posts found</h3>
          <p className="text-gray-600">
            {hasActiveFilters 
              ? `No posts match your current filters. Try adjusting your search criteria or clearing filters.`
              : 'No news posts have been published yet.'
            }
          </p>
          {hasActiveFilters && (
            <Button
              onClick={resetFilters}
              className="mt-4 bg-[#359d49] hover:bg-[#2a6b39] text-white"
            >
              Clear All Filters
            </Button>
          )}
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
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Image */}
      {post.image_url && !imageError && (
        <div className="aspect-video overflow-hidden relative bg-gray-100">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#359d49]"></div>
            </div>
          )}
          <Image
            src={post.image_url}
            alt={post.title}
            fill
            className={`object-cover hover:scale-105 transition-transform duration-300 ${
              imageLoading ? 'opacity-0' : 'opacity-100'
            }`}
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
          />
        </div>
      )}
      
      {/* Fallback for image error or no image */}
      {(!post.image_url || imageError) && (
        <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <p className="text-sm">No image available</p>
          </div>
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