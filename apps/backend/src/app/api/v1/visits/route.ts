import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, requirePermission } from '@/lib/auth/rbac';
import { getUserClient, parsePagination, errorResponse, paginatedResponse, getFilterParams } from '@/lib/api/helpers';

const createVisitSchema = z.object({
  child_id: z.string().uuid('Invalid child ID'),
  visit_type: z.enum(['check_in', 'medication', 'injury', 'illness', 'wellness']),
  reason: z.string().min(1, 'Visit reason required'),
  notes: z.string().optional(),
  started_at: z.string().datetime().optional(),
});

export const GET = requireAuth(async (req: NextRequest, user) => {
  try {
    const supabase = getUserClient(req);
    const { from, to, page, limit } = parsePagination(req);
    const filters = getFilterParams(req, ['child_id', 'visit_type', 'date_from', 'date_to']);

    let query = supabase
      .from('visits')
      .select('*', { count: 'exact' });

    // Apply child filter
    if (filters.child_id) {
      query = query.eq('child_id', filters.child_id);
    }

    // Apply visit type filter
    if (filters.visit_type) {
      query = query.eq('visit_type', filters.visit_type);
    }

    // Apply date range filters
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    // Order by created_at descending
    query = query.order('created_at', { ascending: false });

    const { data, count, error } = await query.range(from, to);

    if (error) {
      return errorResponse(error.message, 400);
    }

    return paginatedResponse(data || [], page, limit, count || 0);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, error instanceof Error && error.message.includes('Unauthorized') ? 401 : 500);
  }
});

export const POST = requirePermission('create:visits', async (req: NextRequest, user) => {
  try {
    const supabase = getUserClient(req);
    const body = await req.json();

    const validatedData = createVisitSchema.parse(body);

    // If no started_at provided, use current time
    const visitData = {
      ...validatedData,
      started_at: validatedData.started_at || new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('visits')
      .insert([visitData])
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
});
