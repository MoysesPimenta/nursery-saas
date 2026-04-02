import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserClient, parsePagination, errorResponse, paginatedResponse, getSearchQuery, getFilterParams, sanitizeSearchInput } from '@/lib/api/helpers';

const createEmployeeSchema = z.object({
  first_name: z.string().min(1, 'First name required'),
  last_name: z.string().min(1, 'Last name required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  department_id: z.string().uuid().optional(),
  role_id: z.string().uuid().optional(),
  hire_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  photo_url: z.string().url().nullable().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const supabase = getUserClient(req);
    const { from, to, page, limit } = parsePagination(req);
    let search = getSearchQuery(req);
    const filters = getFilterParams(req, ['department_id', 'archived']);

    let query = supabase
      .from('employees')
      .select('*', { count: 'exact' });

    // Apply search filter
    if (search) {
      search = sanitizeSearchInput(search);
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Apply department filter
    if (filters.department_id) {
      query = query.eq('department_id', filters.department_id);
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

    const validatedData = createEmployeeSchema.parse(body);

    const { data, error } = await supabase
      .from('employees')
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
