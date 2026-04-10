import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, requirePermission } from '@/lib/auth/rbac';
import { getUserClient, parsePagination, errorResponse, paginatedResponse, getSearchQuery, getFilterParams, sanitizeSearchInput } from '@/lib/api/helpers';

const createChildSchema = z.object({
  first_name: z.string().min(1, 'First name required'),
  last_name: z.string().min(1, 'Last name required'),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  class_id: z.string().uuid().optional().nullable(),
  notes: z.string().optional(),
  photo_url: z.string().url().optional().nullable(),
  gender: z.string().optional(),
  blood_type: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relation: z.string().optional(),
});

export const GET = requireAuth(async (req: NextRequest, user) => {
  try {
    const supabase = getUserClient(req);
    const { from, to, page, limit } = parsePagination(req);
    let search = getSearchQuery(req);
    const filters = getFilterParams(req, ['class_id', 'archived']);

    let query = supabase
      .from('children')
      .select('*, classes(name)', { count: 'exact' });

    if (search) {
      search = sanitizeSearchInput(search);
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    }

    if (filters.class_id) {
      query = query.eq('class_id', filters.class_id);
    }

    if (filters.archived) {
      query = query.eq('is_archived', filters.archived === 'true');
    } else {
      query = query.eq('is_archived', false);
    }

    const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to);

    if (error) {
      return errorResponse(error.message, 400);
    }

    const enriched = (data || []).map((child: Record<string, unknown>) => ({
      ...child,
      class_name: (child.classes as { name: string } | null)?.name || null,
      classes: undefined,
    }));

    return paginatedResponse(enriched, page, limit, count || 0);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, 500);
  }
});

export const POST = requirePermission('manage_children', async (req: NextRequest, user) => {
  try {
    const supabase = getUserClient(req);
    const body = await req.json();
    const validatedData = createChildSchema.parse(body);

    const { data, error } = await supabase
      .from('children')
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
