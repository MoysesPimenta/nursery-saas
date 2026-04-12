import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requirePermission } from '@/lib/auth/rbac';
import { errorResponse, successResponse } from '@/lib/api/helpers';
import { getSupabaseServerClient } from '@/lib/supabase/server';

const updateTenantSchema = z.object({
  name: z.string().min(1, 'Tenant name required').optional(),
  logo_url: z.string().url('Invalid logo URL').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  zip_code: z.string().optional().or(z.literal('')),
  phone: z.string().regex(/^[\d\-\+\(\)\s]*$/, 'Invalid phone number format').optional().or(z.literal('')),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
});

type UpdateTenantInput = z.infer<typeof updateTenantSchema>;

/**
 * GET /api/v1/admin/tenant
 * Get the authenticated user's tenant details
 * Requires: manage:tenant permission
 */
export const GET = requirePermission('manage_users', async (req: NextRequest, user) => {
  try {
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', user.tenantId)
      .single();

    if (error) {
      return errorResponse('Tenant not found', 404);
    }

    if (!data) {
      return errorResponse('Tenant not found', 404);
    }

    return successResponse(data, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, 500);
  }
});

/**
 * PATCH /api/v1/admin/tenant
 * Update tenant settings
 * Requires: manage:tenant permission
 */
export const PATCH = requirePermission('manage_users', async (req: NextRequest, user) => {
  try {
    const body = await req.json();
    const validatedData = updateTenantSchema.parse(body);

    // Filter out undefined values to only update provided fields
    const updateData = Object.fromEntries(
      Object.entries(validatedData).filter(([, value]) => value !== undefined)
    );

    // If no fields to update, return error
    if (Object.keys(updateData).length === 0) {
      return errorResponse('No fields to update', 400);
    }

    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from('tenants')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.tenantId)
      .select()
      .single();

    if (error) {
      return errorResponse(`Failed to update tenant: ${error.message}`, 400);
    }

    if (!data) {
      return errorResponse('Tenant not found', 404);
    }

    return successResponse(data, 200);
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
