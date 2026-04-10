import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePermission } from '@/lib/auth/rbac';
import {
  parsePagination,
  errorResponse,
  paginatedResponse,
  getSearchQuery,
  sanitizeSearchInput,
  successResponse,
} from '@/lib/api/helpers';
import { getSupabaseServerClient } from '@/lib/supabase/server';

const inviteUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  full_name: z.string().min(1, 'Full name required'),
  role_id: z.string().uuid('Invalid role ID'),
});

type InviteUserInput = z.infer<typeof inviteUserSchema>;

/**
 * GET /api/v1/admin/users
 * List all users in the tenant with their roles
 * Requires: manage:users permission
 */
export const GET = requirePermission('manage_users', async (req: NextRequest, user) => {
  try {
    const supabase = getSupabaseServerClient();
    const { from, to, page, limit } = parsePagination(req);
    let search = getSearchQuery(req);

    let query = supabase
      .from('users')
      .select(
        `
        id,
        email,
        full_name,
        is_active,
        created_at,
        updated_at,
        user_roles(
          id,
          roles(id, name)
        )
      `,
        { count: 'exact' }
      )
      .eq('tenant_id', user.tenantId);

    // Apply search filter (by name or email)
    if (search) {
      search = sanitizeSearchInput(search);
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, count, error } = await query.range(from, to);

    if (error) {
      return errorResponse(error.message, 400);
    }

    // Transform the response to flatten role information
    const enriched = (data || []).map((user: Record<string, unknown>) => {
      const userRoles = (user.user_roles as Array<{ id: string; roles: { id: string; name: string } | null }> | null) || [];
      return {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        is_active: user.is_active,
        roles: userRoles.map((ur) => ur.roles).filter((r) => r !== null),
        created_at: user.created_at,
        updated_at: user.updated_at,
      };
    });

    return paginatedResponse(enriched, page, limit, count || 0);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, 500);
  }
});

/**
 * POST /api/v1/admin/users
 * Invite a new user (create auth user + assign role)
 * Requires: manage:users permission
 */
export const POST = requirePermission('manage_users', async (req: NextRequest, user) => {
  try {
    const body = await req.json();
    const validatedData = inviteUserSchema.parse(body);

    const supabase = getSupabaseServerClient();

    // Verify the role exists and belongs to this tenant
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('id, name')
      .eq('id', validatedData.role_id)
      .eq('tenant_id', user.tenantId)
      .single();

    if (roleError || !roleData) {
      return errorResponse('Role not found or does not belong to this tenant', 404);
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', validatedData.email)
      .eq('tenant_id', user.tenantId)
      .single();

    if (existingUser) {
      return errorResponse('User with this email already exists in this tenant', 409);
    }

    // Create auth user via Supabase admin API
    let authUser;
    try {
      const authResponse = await supabase.auth.admin.createUser({
        email: validatedData.email,
        password: generateTempPassword(), // Generate temporary password
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: validatedData.full_name,
        },
      });

      if (authResponse.error) {
        return errorResponse(`Failed to create auth user: ${authResponse.error.message}`, 400);
      }

      authUser = authResponse.data.user;
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : 'Failed to create auth user';
      return errorResponse(message, 400);
    }

    // Create user record in public.users
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: authUser.id,
          email: validatedData.email,
          full_name: validatedData.full_name,
          tenant_id: user.tenantId,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (userError) {
      // Attempt to delete the auth user since user record creation failed
      try {
        await supabase.auth.admin.deleteUser(authUser.id);
      } catch (deleteError) {
        console.error('Failed to clean up auth user after user record creation failure:', deleteError);
      }
      return errorResponse(`Failed to create user record: ${userError.message}`, 400);
    }

    // Assign role in user_roles
    const { data: userRole, error: roleAssignError } = await supabase
      .from('user_roles')
      .insert([
        {
          user_id: authUser.id,
          role_id: validatedData.role_id,
          tenant_id: user.tenantId,
        },
      ])
      .select()
      .single();

    if (roleAssignError) {
      return errorResponse(`Failed to assign role to user: ${roleAssignError.message}`, 400);
    }

    // Return the created user with role information
    const response = {
      id: newUser.id,
      email: newUser.email,
      full_name: newUser.full_name,
      is_active: newUser.is_active,
      role: roleData,
      created_at: newUser.created_at,
    };

    return successResponse(response, 201);
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

/**
 * Generate a temporary password for new users
 * Should be replaced with proper password reset flow in production
 */
function generateTempPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
