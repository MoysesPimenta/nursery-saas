import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/rbac';
import { getUserClient, parsePagination, errorResponse, paginatedResponse, getFilterParams } from '@/lib/api/helpers';

interface ChildInfo {
  first_name: string;
  last_name: string;
}

interface AuthorizationWithChild extends Record<string, unknown> {
  children?: ChildInfo;
  requested_by?: string;
}

interface Employee {
  user_id: string;
  first_name: string;
  last_name: string;
}

const createAuthorizationSchema = z.object({
  child_id: z.string().uuid('Invalid child ID'),
  symptoms: z.string().optional(),
  notes: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional().default('normal'),
});

export const GET = requireAuth(async (req: NextRequest, user) => {
  try {
    const supabase = getUserClient(req);
    const { from, to, page, limit } = parsePagination(req);
    const filters = getFilterParams(req, ['status', 'child_id']);

    let query = supabase
      .from('authorizations')
      .select('*, children(first_name, last_name)', { count: 'exact' });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.child_id) {
      query = query.eq('child_id', filters.child_id);
    }

    query = query.order('created_at', { ascending: false });

    const { data, count, error } = await query.range(from, to);

    if (error) {
      return errorResponse(error.message, 400);
    }

    // Resolve requester names from employees table
    const requesterIds = [...new Set((data || []).map((a: AuthorizationWithChild) => a.requested_by).filter(Boolean))];
    let requesterMap: Record<string, string> = {};
    if (requesterIds.length > 0) {
      const { data: employees } = await supabase
        .from('employees')
        .select('user_id, first_name, last_name')
        .in('user_id', requesterIds);
      if (employees) {
        requesterMap = Object.fromEntries(
          employees.map((e: Employee) => [e.user_id, `${e.first_name} ${e.last_name}`])
        );
      }
    }

    const enriched = (data || []).map((auth: AuthorizationWithChild) => ({
      ...auth,
      child_name: auth.children
        ? `${auth.children.first_name} ${auth.children.last_name}`
        : null,
      requester_name: requesterMap[auth.requested_by || ''] || null,
      children: undefined,
    }));

    return paginatedResponse(enriched, page, limit, count || 0);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, 500);
  }
});

export const POST = requireAuth(async (req: NextRequest, user) => {
  try {
    const supabase = getUserClient(req);
    const body = await req.json();
    const validatedData = createAuthorizationSchema.parse(body);

    const { data, error } = await supabase
      .from('authorizations')
      .insert([{
        ...validatedData,
        tenant_id: user.tenantId,
        requested_by: user.id,
        status: 'pending',
      }])
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
