import { NextRequest } from 'next/server';
import { requirePermission } from '@/lib/auth/rbac';
import { errorResponse, successResponse } from '@/lib/api/helpers';
import { getSupabaseServerClient } from '@/lib/supabase/server';

/**
 * GET /api/v1/admin/roles
 * List all roles for the tenant
 * Requires: manage:users permission
 */
export const GET = requirePermission('manage:users', async (req: NextRequest, user) => {
  try {
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from('roles')
      .select('id, name')
      .eq('tenant_id', user.tenantId)
      .order('name');

    if (error) {
      return errorResponse(error.message, 400);
    }

    return successResponse(data || [], 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, 500);
  }
});
