import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/rbac';
import { getUserClient, errorResponse, successResponse } from '@/lib/api/helpers';

export const GET = requireAuth(async (req: NextRequest, user) => {
  try {
    const supabase = getUserClient(req);

    // Get today's date in ISO format
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const todayISO = today.toISOString().split('T')[0];
    const tomorrowISO = tomorrow.toISOString().split('T')[0];

    // Get visits today
    const { count: visitsTodayCount, error: visitsError } = await supabase
      .from('visits')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${todayISO}T00:00:00Z`)
      .lt('created_at', `${tomorrowISO}T00:00:00Z`);

    if (visitsError) {
      return errorResponse(visitsError.message, 400);
    }

    // Get pending authorizations
    const { count: pendingAuthCount, error: authError } = await supabase
      .from('authorizations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (authError) {
      return errorResponse(authError.message, 400);
    }

    // Get active (non-archived) children
    const { count: activeChildrenCount, error: childError } = await supabase
      .from('children')
      .select('*', { count: 'exact', head: true })
      .eq('archived', false);

    if (childError) {
      return errorResponse(childError.message, 400);
    }

    // Get children with allergies (count for alerts)
    const { data: childrenWithAllergies, error: allergyError } = await supabase
      .from('child_allergies')
      .select('child_id', { count: 'exact' })
      .limit(0);

    if (allergyError) {
      return errorResponse(allergyError.message, 400);
    }

    const dashboardStats = {
      visits_today: visitsTodayCount || 0,
      pending_authorizations: pendingAuthCount || 0,
      active_children_count: activeChildrenCount || 0,
      allergy_alerts_count: childrenWithAllergies?.length || 0,
      timestamp: new Date().toISOString(),
    };

    return successResponse(dashboardStats);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, error instanceof Error && error.message.includes('Unauthorized') ? 401 : 500);
  }
});
