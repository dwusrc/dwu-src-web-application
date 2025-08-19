'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { PageLayout } from '@/app/components/layout/page-layout';
import { newsPostsApi } from '@/lib/news-api';
import { NewsPost } from '@/types/supabase';
import { Button } from '@/app/components/ui/button';
import Link from 'next/link';

export default function NewsDetailPage() {
  const params = useParams();
  const [post, setPost] = useState<NewsPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadPost(params.id as string);
    }
  }, [params.id]);

  const loadPost = async (id: string) => {
    try {
      setLoading(true);
      const postData = await newsPostsApi.getPost(id);
      setPost(postData);
    } catch {
      alert('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#359d49]"></div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!post) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Post Not Found</h1>
            <p className="text-gray-600 mb-6">The requested news post could not be found.</p>
            <Button
              onClick={() => window.history.back()}
              className="bg-[#359d49] hover:bg-[#2a6b39] text-white"
            >
              Go Back
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <ol className="flex items-center space-x-2 text-sm text-gray-600">
              <li>
                <Link href="/" className="hover:text-[#359d49]">Home</Link>
              </li>
              <li>/</li>
              <li>
                <Link href="/news" className="hover:text-[#359d49]">News</Link>
              </li>
              <li>/</li>
              <li className="text-gray-900">{post.title}</li>
            </ol>
          </nav>

          {/* Article */}
          <article className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Featured Image */}
            {post.image_url && (
              <div className="aspect-video overflow-hidden">
                <Image
                  src={post.image_url}
                  alt={post.title}
                  width={800}
                  height={450}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Article Content */}
            <div className="p-8">
              {/* Meta Information */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  {post.category_id && (
                    <span className="px-3 py-1 bg-[#359d49] text-white text-sm font-medium rounded-full">
                      Category
                    </span>
                  )}
                  {post.featured && (
                    <span className="px-3 py-1 bg-[#ddc753] text-white text-sm font-medium rounded-full">
                      Featured
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {formatDate(post.created_at)}
                </div>
              </div>

              {/* Title */}
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {post.title}
              </h1>

              {/* Excerpt */}
              {post.excerpt && (
                <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                  {post.excerpt}
                </p>
              )}

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {post.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Content */}
              <div className="prose prose-lg max-w-none">
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {post.content}
                </div>
              </div>

              {/* Article Footer */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span>{post.view_count || 0} views</span>
                    {post.allow_comments && (
                      <span>Comments enabled</span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => window.history.back()}
                      className="bg-gray-600 hover:bg-gray-700 text-white"
                    >
                      Back to News
                    </Button>
                    <Button
                      onClick={() => window.open('/news', '_blank')}
                      className="bg-[#359d49] hover:bg-[#2a6b39] text-white"
                    >
                      View All News
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </PageLayout>
  );
} 