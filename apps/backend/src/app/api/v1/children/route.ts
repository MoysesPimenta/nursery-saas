import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserClient, parsePagination, errorResponse, paginatedResponse, getSearchQuery, getFilterParams, sanitizeSearchInput } from '@/lib/api/helpers';

const createChildSchema = z.object({
  first_name: z.string().min(1, 'First name required'),
  last_name: z.string().min(1, 'Last name required'),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  enrollment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  class_id: z.string().uuid().optional(),
  notes: z.string().optional(),
  photo_url: z.string().url().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const supabase = getUserClient(req);
    const { from, to, page, limit } = parsePagination(req);
    let search = getSearchQuery(req);
    const filters = getFilterParams(req, ['class_id', 'archived']);

    let query = supabase
      .from('children')
      .select('*', { count: 'exact' });

    // Apply search filter
    if (search) {
      search = sanitizeSearchInput(search);
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    }

    // Apply class filter
    if (filters.class_id) {
      query = query.eq('class_id', filters.class_id);
    }

    // Apply archived filter
    if (filters.archived) {
      query = query.eq('archived', filters.archived === 'true');
    } else {
      query = query.eq('archived', false);
    }

    // Apply pagination
    const { data, count, error } = await query.range(from, to);

    if (error) {
      return errorResponse(error.message, 400);
    }

    return paginatedResponse(data || [], page, limit, count || 0);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, error instanceof Error && error.message.includes('Unauthorized') ? 401 : 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getUserClient(req);
    const body = await req.json();

    const validatedData = createChildSchema.parse(body);

    const { data, error } = await supabase
      .from('children')
      .insert([validatedData])
      .select()
      .single();

    if (error) {
      return errorResponse(error.message, 400);
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(
        `Validation error: ${error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        400
      );
    }
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, error instanceof Error && error.message.includes('Unauthorized') ? 401 : 500);
  }
}
