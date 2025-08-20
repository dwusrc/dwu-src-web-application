import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is Admin or SRC President
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, src_department')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'src'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // SRC members must be President to manage categories
    if (profile.role === 'src' && profile.src_department !== 'President') {
      return NextResponse.json({ error: 'Only SRC President can manage categories' }, { status: 403 });
    }

    const { name, description, color, is_active } = await request.json();

    // Validate required fields
    if (!name || !color) {
      return NextResponse.json({ error: 'Name and color are required' }, { status: 400 });
    }

    // Validate color format (hex color)
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!colorRegex.test(color)) {
      return NextResponse.json({ error: 'Invalid color format. Use hex color (e.g., #3b82f6)' }, { status: 400 });
    }

    // Check if name already exists (excluding current category)
    const { data: existingCategory } = await supabase
      .from('report_categories')
      .select('id')
      .eq('name', name.trim())
      .neq('id', id)
      .single();

    if (existingCategory) {
      return NextResponse.json({ error: 'Category name already exists' }, { status: 400 });
    }

    // Update category
    const { data, error } = await supabase
      .from('report_categories')
      .update({
        name: name.trim(),
        description: description?.trim() || null,
        color,
        is_active: is_active !== undefined ? is_active : true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating category:', error);
      return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
    }

    return NextResponse.json({ category: data });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is Admin or SRC President
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, src_department')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'src'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // SRC members must be President to manage categories
    if (profile.role === 'src' && profile.src_department !== 'President') {
      return NextResponse.json({ error: 'Only SRC President can manage categories' }, { status: 403 });
    }

    // Check if category is being used by any reports
    const { data: reportsUsingCategory, error: reportsError } = await supabase
      .from('reports')
      .select('id, title')
      .eq('category_id', id)
      .limit(5);

    if (reportsError) {
      console.error('Error checking category usage:', reportsError);
      return NextResponse.json({ error: 'Failed to check category usage' }, { status: 500 });
    }

    if (reportsUsingCategory && reportsUsingCategory.length > 0) {
      const reportTitles = reportsUsingCategory.map(r => r.title).join(', ');
      return NextResponse.json({ 
        error: `Cannot delete category. It is being used by ${reportsUsingCategory.length} report(s): ${reportTitles}` 
      }, { status: 400 });
    }

    // Delete category
    const { error } = await supabase
      .from('report_categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting category:', error);
      return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
