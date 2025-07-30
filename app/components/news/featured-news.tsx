'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { NewsPost } from '@/types/supabase';
import { newsPostsApi } from '@/lib/news-api';
import { Button } from '@/app/components/ui/button';

interface FeaturedNewsProps {
  limit?: number;
  showViewAll?: boolean;
}

export default function FeaturedNews({ limit = 3, showViewAll = true }: FeaturedNewsProps) {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  const loadFeaturedPosts = async () => {
    try {
      setLoading(true);
      const postsData = await newsPostsApi.getPosts({
        featured: true,
        limit,
        offset: 0
      });
      setPosts(postsData);
    } catch (error) {
      console.error('Error loading featured posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#359d49]"></div>
      </div>
    );
  }

  if (posts.length === 0) {
    return null; // Don't show anything if no featured posts
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Featured News</h2>
          <p className="text-gray-600">Latest highlights and important announcements</p>
        </div>
        {showViewAll && (
          <Button
            onClick={() => window.open('/news', '_blank')}
            className="bg-[#359d49] hover:bg-[#2a6b39] text-white"
          >
            View All News
          </Button>
        )}
      </div>

      {/* Featured Posts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {posts.map((post, index) => (
          <FeaturedNewsCard
            key={post.id}
            post={post}
            isMain={index === 0}
            formatDate={formatDate}
          />
        ))}
      </div>
    </div>
  );
}

// Featured News Card Component
interface FeaturedNewsCardProps {
  post: NewsPost;
  isMain: boolean;
  formatDate: (dateString: string) => string;
}

function FeaturedNewsCard({ post, isMain, formatDate }: FeaturedNewsCardProps) {
  return (
    <article className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 ${
      isMain ? 'lg:col-span-2' : ''
    }`}>
      {/* Image */}
      {post.image_url && (
        <div className={`overflow-hidden ${isMain ? 'aspect-video' : 'aspect-square'}`}>
          <Image
            src={post.image_url}
            alt={post.title}
            width={isMain ? 800 : 400}
            height={isMain ? 450 : 400}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {/* Featured Badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#ddc753] text-white">
            Featured
          </span>
          <span className="text-sm text-gray-500">
            {formatDate(post.created_at)}
          </span>
        </div>

        {/* Title */}
        <h3 className={`font-semibold text-gray-900 mb-2 line-clamp-2 ${
          isMain ? 'text-2xl' : 'text-lg'
        }`}>
          {post.title}
        </h3>

        {/* Excerpt */}
        {post.excerpt && (
          <p className={`text-gray-600 mb-4 line-clamp-3 ${
            isMain ? 'text-base' : 'text-sm'
          }`}>
            {post.excerpt}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <span>{post.view_count || 0} views</span>
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
            </div>
          )}
        </div>

        {/* Read More Button */}
        <Button
          className="w-full bg-[#359d49] hover:bg-[#2a6b39] text-white"
          onClick={() => window.open(`/news/${post.id}`, '_blank')}
        >
          Read More
        </Button>
      </div>
    </article>
  );
} 