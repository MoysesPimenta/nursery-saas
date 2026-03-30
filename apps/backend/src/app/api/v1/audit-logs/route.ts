import { NextRequest } from 'next/server';
import { getUserClient, parsePagination, errorResponse, paginatedResponse, getFilterParams } from '@/lib/api/helpers';

export async function GET(req: NextRequest) {
  try {
    const supabase = getUserClient(req);
    const { from, to, page, limit } = parsePagination(req);
    const filters = getFilterParams(req, ['entity_type', 'user_id', 'date_from', 'date_to']);

    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' });

    // Apply entity_type filter
    if (filters.entity_type) {
      query = query.eq('entity_type', filters.entity_type);
    }

    // Apply user_id filter
    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    // Apply date range filters
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    // Order by created_at descending (newest first)
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
}
