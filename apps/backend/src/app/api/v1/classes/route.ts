import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, requirePermission } from '@/lib/auth/rbac';
import { getUserClient, parsePagination, errorResponse, paginatedResponse, getSearchQuery, sanitizeSearchInput } from '@/lib/api/helpers';

const createClassSchema = z.object({
  name: z.string().min(1, 'Class name required'),
  description: z.string().optional(),
  grade_level: z.string().optional(),
  academic_year: z.string().optional(),
  teacher_id: z.string().uuid().optional().nullable(),
  capacity: z.number().int().positive().optional(),
});

export const GET = requireAuth(async (req: NextRequest, user) => {
  try {
    const supabase = getUserClient(req);
    const { from, to, page, limit } = parsePagination(req);
    let search = getSearchQuery(req);

    let query = supabase
      .from('classes')
      .select('*', { count: 'exact' });

    if (search) {
      search = sanitizeSearchInput(search);
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, count, error } = await query.order('name').range(from, to);

    if (error) {
      return errorResponse(error.message, 400);
    }

    return paginatedResponse(data || [], page, limit, count || 0);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, 500);
  }
});

export const POST = requirePermission('manage_classes', async (req: NextRequest, user) => {
  try {
    const supabase = getUserClient(req);
    const body = await req.json();
    const validatedData = createClassSchema.parse(body);

    const { data, error } = await supabase
      .from('classes')
      .insert([{ ...validatedData, tenant_id: user.tenantId }])
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
    return errorResponse(message, 500);
  }
});
