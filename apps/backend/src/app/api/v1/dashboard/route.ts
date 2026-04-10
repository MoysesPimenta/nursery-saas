import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/rbac';
import { getUserClient, errorResponse, successResponse } from '@/lib/api/helpers';

export const GET = requireAuth(async (req: NextRequest, user) => {
  try {
    const supabase = getUserClient(req);

    // Get today's date range
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const todayISO = today.toISOString().split('T')[0];
    const tomorrowISO = tomorrow.toISOString().split('T')[0];

    // Run all queries in parallel for performance
    const [visitsResult, authResult, childrenResult, staffResult, allergyResult, recentActivityResult] = await Promise.all([
      // Visits today
      supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${todayISO}T00:00:00Z`)
        .lt('created_at', `${tomorrowISO}T00:00:00Z`),
      // Pending authorizations
      supabase
        .from('authorizations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      // Active children
      supabase
        .from('children')
        .select('*', { count: 'exact', head: true })
        .eq('is_archived', false),
      // Active staff
      supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('is_archived', false),
      // Children with allergies
      supabase
        .from('child_allergies')
        .select('child_id', { count: 'exact', head: true }),
      // Recent activity (last 10 audit log entries)
      supabase
        .from('audit_logs')
        .select('id, action, entity_type, entity_id, created_at')
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    // Return camelCase keys matching frontend interface
    const dashboardStats = {
      childrenCount: childrenResult.count || 0,
      staffCount: staffResult.count || 0,
      visitsToday: visitsResult.count || 0,
      pendingAuthorizations: authResult.count || 0,
      allergyAlerts: allergyResult.count || 0,
      recentActivity: recentActivityResult.data || [],
      timestamp: new Date().toISOString(),
    };

    return successResponse(dashboardStats);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, error instanceof Error && error.message.includes('Unauthorized') ? 401 : 500);
  }
});
