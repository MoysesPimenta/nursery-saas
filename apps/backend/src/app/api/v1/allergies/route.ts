import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, requirePermission } from '@/lib/auth/rbac';
import { getUserClient, parsePagination, errorResponse, paginatedResponse, getSearchQuery, sanitizeSearchInput } from '@/lib/api/helpers';

const createAllergySchema = z.object({
  name: z.string().min(1, 'Allergy name required'),
  description: z.string().optional(),
  severity: z.enum(['mild', 'moderate', 'severe']).optional(),
});

export const GET = requireAuth(async (req: NextRequest, user) => {
  try {
    const supabase = getUserClient(req);
    const { from, to, page, limit } = parsePagination(req);
    let search = getSearchQuery(req);

    let query = supabase
      .from('allergies')
      .select('*', { count: 'exact' })
      .is('deleted_at', null);

    if (search) {
      search = sanitizeSearchInput(search);
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

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

export const POST = requirePermission('manage:allergies', async (req: NextRequest, user) => {
  try {
    const supabase = getUserClient(req);
    const body = await req.json();

    const validatedData = createAllergySchema.parse(body);

    const { data, error } = await supabase
      .from('allergies')
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
});
