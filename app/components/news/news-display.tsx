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
      {/* Clean, Modern News Filters */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Discover News</h3>
              <p className="text-sm text-gray-600 mt-1">Find the latest updates and announcements</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-[#359d49]">{posts.length}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Posts Found</div>
            </div>
          </div>

          {/* Search Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search News</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by title, content, or keywords..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="block w-full pl-12 pr-12 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#359d49] focus:border-[#359d49] transition-colors duration-200 bg-gray-50 hover:bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-gray-100 rounded-r-lg transition-colors duration-200"
                >
                  <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Filter Controls Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#359d49] focus:border-[#359d49] transition-colors duration-200 bg-gray-50 hover:bg-white"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Period Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
              <select
                value={selectedTimePeriod}
                onChange={(e) => {
                  setSelectedTimePeriod(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#359d49] focus:border-[#359d49] transition-colors duration-200 bg-gray-50 hover:bg-white"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">Last 3 Months</option>
                <option value="year">This Year</option>
              </select>
            </div>
          </div>

          {/* Active Filters & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Active Filter Tags */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm font-medium text-gray-700">Active filters:</span>
                {selectedCategory !== 'all' && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    {selectedCategory}
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className="ml-2 hover:bg-blue-100 rounded-full p-0.5 transition-colors duration-200"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                {selectedTimePeriod !== 'all' && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-50 text-green-700 border border-green-200">
                    <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    {selectedTimePeriod === 'today' ? 'Today' : 
                     selectedTimePeriod === 'week' ? 'This Week' :
                     selectedTimePeriod === 'month' ? 'This Month' :
                     selectedTimePeriod === 'quarter' ? 'Last 3 Months' :
                     selectedTimePeriod === 'year' ? 'This Year' : selectedTimePeriod}
                    <button
                      onClick={() => setSelectedTimePeriod('all')}
                      className="ml-2 hover:bg-green-100 rounded-full p-0.5 transition-colors duration-200"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-purple-50 text-purple-700 border border-purple-200">
                    <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                    &ldquo;{searchQuery}&rdquo;
                    <button
                      onClick={() => setSearchQuery('')}
                      className="ml-2 hover:bg-purple-100 rounded-full p-0.5 transition-colors duration-200"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Button
                onClick={resetFilters}
                variant="outline"
                className="px-4 py-2 text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear All Filters
              </Button>
            )}
          </div>
        </div>
      )}

      {/* News Grid */}
      {posts.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Latest News</h3>
            <div className="text-sm text-gray-500">
              Showing {posts.length} of {totalPosts} posts
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <NewsCard key={post.id} post={post} getCategoryName={getCategoryName} getCategoryColor={getCategoryColor} formatDate={formatDate} />
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Empty State */}
      {posts.length === 0 && !loading && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="text-gray-300 text-8xl mb-6">📰</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">No news posts found</h3>
          <p className="text-gray-600 max-w-md mx-auto mb-6">
            {hasActiveFilters 
              ? `No posts match your current filters. Try adjusting your search criteria or clearing filters to see more results.`
              : 'No news posts have been published yet. Check back later for updates and announcements.'
            }
          </p>
          {hasActiveFilters && (
            <Button
              onClick={resetFilters}
              className="bg-[#359d49] hover:bg-[#2a6b39] text-white px-6 py-3 rounded-lg transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear All Filters
            </Button>
          )}
        </div>
      )}

      {/* Enhanced Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              Showing page <span className="font-semibold text-gray-900">{currentPage}</span> of <span className="font-semibold text-gray-900">{totalPages}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                variant="outline"
                className="px-4 py-2 text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </Button>
              
              <Button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                variant="outline"
                className="px-4 py-2 text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Next
                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </div>
          </div>
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
    <article className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg hover:border-gray-200 transition-all duration-300 group">
      {/* Image */}
      {post.image_url && !imageError && (
        <div className="aspect-video overflow-hidden relative bg-gray-100">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#359d49]"></div>
            </div>
          )}
          <Image
            src={post.image_url}
            alt={post.title}
            fill
            className={`object-cover group-hover:scale-105 transition-transform duration-500 ${
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
        <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center group-hover:from-gray-200 group-hover:to-gray-300 transition-colors duration-300">
          <div className="text-center text-gray-400 group-hover:text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-medium">No image available</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {/* Category Badge */}
        <div className="flex items-center gap-2 mb-4">
          <span
            className="px-3 py-1.5 rounded-full text-xs font-semibold text-white shadow-sm"
            style={{ backgroundColor: getCategoryColor(post.category_id) }}
          >
            {getCategoryName(post.category_id)}
          </span>
          {post.featured && (
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-sm">
              ⭐ Featured
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-[#359d49] transition-colors duration-200">
          {post.title}
        </h3>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-gray-600 mb-5 line-clamp-3 leading-relaxed">
            {post.excerpt}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formatDate(post.created_at)}</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>{post.view_count || 0} views</span>
            </div>
          </div>
          
          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex gap-1">
              {post.tags.slice(0, 2).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-50 text-gray-600 rounded-md text-xs font-medium border border-gray-200"
                >
                  {tag}
                </span>
              ))}
              {post.tags.length > 2 && (
                <span className="px-2 py-1 bg-gray-50 text-gray-600 rounded-md text-xs font-medium border border-gray-200">
                  +{post.tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Read More Button */}
        <div className="mt-4">
          <Button
            className="w-full bg-[#359d49] hover:bg-[#2a6b39] text-white py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
            onClick={() => window.open(`/news/${post.id}`, '_blank')}
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Read More
          </Button>
        </div>
      </div>
    </article>
  );
} 