import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, requirePermission } from '@/lib/auth/rbac';
import { getUserClient, parsePagination, errorResponse, paginatedResponse, getFilterParams } from '@/lib/api/helpers';

const createVisitSchema = z.object({
  child_id: z.string().uuid('Invalid child ID').optional().nullable(),
  employee_id: z.string().uuid('Invalid employee ID').optional().nullable(),
  authorization_id: z.string().uuid().optional().nullable(),
  visit_type: z.string().min(1, 'Visit type required'),
  chief_complaint: z.string().optional(),
  vitals: z.record(z.unknown()).optional().nullable(),
  assessment: z.string().optional(),
  treatment: z.string().optional(),
  medications_administered: z.array(z.record(z.unknown())).optional().nullable(),
  disposition: z.string().optional(),
  parent_notified: z.boolean().optional().default(false),
  started_at: z.string().datetime().optional(),
});

export const GET = requireAuth(async (req: NextRequest, user) => {
  try {
    const supabase = getUserClient(req);
    const { from, to, page, limit } = parsePagination(req);
    const filters = getFilterParams(req, ['child_id', 'visit_type', 'date_from', 'date_to']);

    let query = supabase
      .from('visits')
      .select('*, children(first_name, last_name)', { count: 'exact' });

    if (filters.child_id) {
      query = query.eq('child_id', filters.child_id);
    }

    if (filters.visit_type) {
      query = query.eq('visit_type', filters.visit_type);
    }

    if (filters.date_from) {
      query = query.gte('started_at', `${filters.date_from}T00:00:00`);
    }

    if (filters.date_to) {
      query = query.lte('started_at', `${filters.date_to}T23:59:59`);
    }

    query = query.order('created_at', { ascending: false });

    const { data, count, error } = await query.range(from, to);

    if (error) {
      return errorResponse(error.message, 400);
    }

    const enriched = (data || []).map((visit: Record<string, unknown>) => ({
      ...visit,
      child_name: visit.children
        ? `${(visit.children as any).first_name} ${(visit.children as any).last_name}`
        : null,
      children: undefined,
    }));

    return paginatedResponse(enriched, page, limit, count || 0);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, 500);
  }
});

export const POST = requirePermission('manage_visits', async (req: NextRequest, user) => {
  try {
    const supabase = getUserClient(req);
    const body = await req.json();
    const validatedData = createVisitSchema.parse(body);

    const visitData = {
      ...validatedData,
      tenant_id: user.tenantId,
      nurse_id: user.id,
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
    return errorResponse(message, 500);
  }
});
