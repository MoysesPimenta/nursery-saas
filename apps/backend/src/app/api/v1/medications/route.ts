import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, requirePermission } from '@/lib/auth/rbac';
import { getUserClient, parsePagination, errorResponse, paginatedResponse, getSearchQuery, sanitizeSearchInput } from '@/lib/api/helpers';

const createMedicationSchema = z.object({
  name: z.string().min(1, 'Medication name required'),
  generic_name: z.string().optional(),
  dosage_form: z.string().optional(),
  default_dosage: z.string().optional(),
  instructions: z.string().optional(),
  requires_authorization: z.boolean().optional().default(true),
});

export const GET = requireAuth(async (req: NextRequest, user) => {
  try {
    const supabase = getUserClient(req);
    const { from, to, page, limit } = parsePagination(req);
    let search = getSearchQuery(req);

    let query = supabase
      .from('medications')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    if (search) {
      search = sanitizeSearchInput(search);
      query = query.or(`name.ilike.%${search}%,generic_name.ilike.%${search}%`);
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

export const POST = requirePermission('manage_medications', async (req: NextRequest, user) => {
  try {
    const supabase = getUserClient(req);
    const body = await req.json();
    const validatedData = createMedicationSchema.parse(body);

    const { data, error } = await supabase
      .from('medications')
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
