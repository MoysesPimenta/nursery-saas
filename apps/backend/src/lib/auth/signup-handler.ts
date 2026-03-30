import { getSupabaseServerClient } from '../supabase/server';
import { SignupRequest, SignupResponse } from '../validation/auth-schemas';

/**
 * Server-side signup handler
 * Creates new user in Supabase Auth and sets up their profile
 *
 * Steps:
 * 1. Create auth user via Supabase Auth
 * 2. Create tenant if doesn't exist
 * 3. Create user profile in public.users table
 * 4. Assign default role via user_roles
 * 5. Return user data and session tokens
 */
export async function handleSignup(payload: SignupRequest): Promise<SignupResponse> {
  const adminClient = getSupabaseServerClient();

  try {
    // Step 1: Check if tenant already exists or needs to be created
    let tenantId: string;

    const { data: existingTenant } = await adminClient
      .from('tenants')
      .select('id')
      .eq('slug', payload.tenantSlug)
      .single();

    if (existingTenant) {
      tenantId = existingTenant.id;
    } else {
      // Create new tenant
      const { data: newTenant, error: tenantError } = await adminClient
        .from('tenants')
        .insert({
          name: payload.tenantName || payload.tenantSlug,
          slug: payload.tenantSlug,
          is_active: true,
        })
        .select('id')
        .single();

      if (tenantError || !newTenant) {
        throw new Error(`Failed to create tenant: ${tenantError?.message}`);
      }

      tenantId = newTenant.id;
    }

    // Step 2: Create auth user via Supabase Auth
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      email_confirm: true, // Auto-confirm email in development
      user_metadata: {
        full_name: payload.fullName,
      },
    });

    if (authError || !authData.user) {
      throw new Error(`Failed to create auth user: ${authError?.message}`);
    }

    const userId = authData.user.id;

    // Step 3: Create user profile in public.users table
    const { error: userError } = await adminClient
      .from('users')
      .insert({
        id: userId,
        email: payload.email,
        full_name: payload.fullName,
        tenant_id: tenantId,
      });

    if (userError) {
      // Clean up: delete the auth user if user profile creation fails
      await adminClient.auth.admin.deleteUser(userId);
      throw new Error(`Failed to create user profile: ${userError.message}`);
    }

    // Step 4: Assign default role (user_member) via user_roles
    // First, get or create the default role
    let roleId: string;

    const { data: existingRole } = await adminClient
      .from('roles')
      .select('id')
      .eq('name', 'user_member')
      .eq('tenant_id', tenantId)
      .single();

    if (existingRole) {
      roleId = existingRole.id;
    } else {
      // Create default role if it doesn't exist
      const { data: newRole, error: roleError } = await adminClient
        .from('roles')
        .insert({
          tenant_id: tenantId,
          name: 'user_member',
          description: 'Default user role',
        })
        .select('id')
        .single();

      if (roleError || !newRole) {
        throw new Error(`Failed to create default role: ${roleError?.message}`);
      }

      roleId = newRole.id;
    }

    // Assign role to user
    const { error: userRoleError } = await adminClient
      .from('user_roles')
      .insert({
        user_id: userId,
        tenant_id: tenantId,
        role_id: roleId,
      });

    if (userRoleError) {
      console.error('Failed to assign default role:', userRoleError.message);
      // Don't fail entirely if role assignment fails, but log it
    }

    // Step 5: Generate session tokens (use Supabase Auth's token)
    // In a real scenario, you might want to use Supabase's session functionality
    // For now, we'll return the user data and indicate they need to sign in

    return {
      user: {
        id: userId,
        email: payload.email,
        fullName: payload.fullName,
        tenantId,
        roles: ['user_member'],
        createdAt: new Date().toISOString(),
      },
      session: {
        accessToken: '', // Client should call login endpoint to get session
        refreshToken: '',
        expiresIn: 0,
        expiresAt: 0,
      },
    };
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
}
