import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    const timePeriod = searchParams.get('timePeriod');
    const searchQuery = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('news_posts')
      .select(`
        *,
        author:profiles!news_posts_author_id_fkey(full_name, avatar_url),
        category:news_categories!news_posts_category_id_fkey(name, color)
      `)
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (category && category !== 'all') {
      // First get the category ID for the given name
      console.log('Filtering by category:', category);
      
      const { data: categoryData, error: categoryError } = await supabase
        .from('news_categories')
        .select('id')
        .eq('name', category)
        .eq('is_active', true)
        .single();
      
      if (categoryError) {
        console.error('Error fetching category:', categoryError);
        return NextResponse.json({ error: 'Category not found' }, { status: 400 });
      }
      
      if (categoryData) {
        console.log('Found category ID:', categoryData.id);
        query = query.eq('category_id', categoryData.id);
      }
    }

    if (featured === 'true') {
      query = query.eq('featured', true);
    }

    // Time period filtering
    if (timePeriod) {
      const now = new Date();
      let startDate: Date;
      
      switch (timePeriod) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          break;
        case 'quarter':
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
          break;
        case 'year':
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          break;
        default:
          startDate = new Date(0); // Beginning of time
      }
      
      query = query.gte('created_at', startDate.toISOString());
    }

    // Search functionality
    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%`);
    }

    const { data: posts, error } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching posts:', error);
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Check if user is SRC or Admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['src', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const {
      title,
      content,
      excerpt,
      category_id,
      status = 'draft',
      featured = false,
      image_url,
      tags = [],
      allow_comments = true
    } = await request.json();

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('news_posts')
      .insert({
        title,
        content,
        excerpt,
        author_id: user.id,
        category_id,
        status,
        featured,
        image_url,
        tags,
        allow_comments,
        published_at: status === 'published' ? new Date().toISOString() : null
      })
      .select(`
        *,
        author:profiles!news_posts_author_id_fkey(full_name, avatar_url),
        category:news_categories!news_posts_category_id_fkey(name, color)
      `)
      .single();

    if (error) {
      console.error('Error creating post:', error);
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }

    return NextResponse.json({ post: data });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 