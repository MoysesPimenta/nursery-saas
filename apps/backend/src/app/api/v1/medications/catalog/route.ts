import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/rbac';
import { getUserClient, errorResponse, successResponse } from '@/lib/api/helpers';

/**
 * GET /api/v1/medications/catalog
 * Returns a simplified list of active medications for dropdown selections
 * Filtered by tenant_id and is_active = true, ordered by name
 */
export const GET = requireAuth(async (req: NextRequest, user) => {
  try {
    const supabase = getUserClient(req);

    const { data, error } = await supabase
      .from('medications')
      .select('id, name, default_dosage, dosage_form')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('name', { ascending: true });

    if (error) {
      return errorResponse(error.message, 400);
    }

    return successResponse({
      data: data || [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, error instanceof Error && error.message.includes('Unauthorized') ? 401 : 500);
  }
});
