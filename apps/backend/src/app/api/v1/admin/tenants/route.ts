import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/rbac';
import {
  parsePagination,
  errorResponse,
  paginatedResponse,
  getSearchQuery,
  sanitizeSearchInput,
} from '@/lib/api/helpers';
import { getSupabaseServerClient } from '@/lib/supabase/server';

/**
 * GET /api/v1/admin/tenants
 * List all tenants with pagination and search (super_admin only)
 * Requires: super_admin role
 */
export const GET = requireAuth(async (req: NextRequest, user) => {
  try {
    // Check if user is super_admin
    if (!user.roles.includes('super_admin')) {
      return errorResponse('Forbidden: super_admin role required', 403);
    }

    const supabase = getSupabaseServerClient();
    const { from, to, page, limit } = parsePagination(req);
    let search = getSearchQuery(req);

    let query = supabase
      .from('tenants')
      .select('*', { count: 'exact' });

    // Apply search filter (by name or slug)
    if (search) {
      search = sanitizeSearchInput(search);
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    const { data, count, error } = await query.range(from, to);

    if (error) {
      return errorResponse(error.message, 400);
    }

    // Transform database fields to match Tenant interface
    const enriched = (data || []).map((tenant: Record<string, unknown>) => ({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      subdomain: tenant.subdomain,
      logoUrl: tenant.logo_url,
      themeColor: tenant.theme_color,
      faviconUrl: tenant.favicon_url,
      subscriptionTier: tenant.subscription_tier,
      maxChildren: tenant.max_children,
      maxEmployees: tenant.max_employees,
      maxStorageMb: tenant.max_storage_mb,
      isActive: tenant.is_active,
      settings: tenant.settings,
      createdAt: tenant.created_at,
      updatedAt: tenant.updated_at,
    }));

    return paginatedResponse(enriched, page, limit, count || 0);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, 500);
  }
});
