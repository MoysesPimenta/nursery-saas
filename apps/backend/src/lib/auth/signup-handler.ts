import { getSupabaseServerClient } from '../supabase/server';
import { SignupRequest, SignupResponse } from '../validation/auth-schemas';
import { randomUUID } from 'crypto';

const DEFAULT_ROLE_ID = '4d9869e5-632d-46ba-a729-095af0e7c9e5'; // school_admin

export async function handleSignup(payload: SignupRequest): Promise<SignupResponse> {
  const adminClient = getSupabaseServerClient();
  const fullName = `${payload.firstName} ${payload.lastName}`;
  const newTenantId = randomUUID();

  // Step 1: Create auth user (auto-confirmed)
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: payload.email,
    password: payload.password,
    email_confirm: true,
    user_metadata: {
      first_name: payload.firstName,
      last_name: payload.lastName,
      full_name: fullName,
    },
  });

  if (authError || !authData.user) {
    throw new Error(authError?.message || 'Failed to create account');
  }

  const userId = authData.user.id;

  try {
    // Step 2: Create a new tenant for the school
    const { error: tenantError } = await adminClient
      .from('tenants')
      .insert({
        id: newTenantId,
        name: fullName,
        slug: generateTenantSlug(payload.email),
        is_active: true,
      });

    if (tenantError) {
      // Cleanup: delete auth user on failure
      await adminClient.auth.admin.deleteUser(userId);
      throw new Error(`Failed to create tenant: ${tenantError.message}`);
    }

    // Step 3: Create user profile in public.users
    const { error: userError } = await adminClient
      .from('users')
      .insert({
        id: userId,
        email: payload.email,
        full_name: fullName,
        tenant_id: newTenantId,
        is_active: true,
      });

    if (userError) {
      // Cleanup: delete auth user and tenant on failure
      await adminClient.auth.admin.deleteUser(userId);
      await adminClient.from('tenants').delete().eq('id', newTenantId);
      throw new Error(`Failed to create user profile: ${userError.message}`);
    }

    // Step 4: Assign school_admin role
    const { error: roleError } = await adminClient
      .from('user_roles')
      .insert({
        user_id: userId,
        role_id: DEFAULT_ROLE_ID,
        tenant_id: newTenantId,
      });

    if (roleError) {
      console.error('Failed to assign role:', roleError.message);
      // Don't fail signup if role assignment fails, but log it
    }

    return {
      user: {
        id: userId,
        email: payload.email,
        fullName,
        tenantId: newTenantId,
        roles: ['school_admin'],
      },
      message: 'Account created successfully. You can now sign in.',
    };
  } catch (error) {
    // Cleanup on any failure
    await adminClient.auth.admin.deleteUser(userId).catch(() => {});
    throw error;
  }
}

/**
 * Generate a URL-friendly tenant slug from email
 * Example: john.doe@example.com -> john-doe-example
 */
function generateTenantSlug(email: string): string {
  const baseSlug = email
    .split('@')[0] // Get part before @
    .replace(/[^a-z0-9]+/gi, '-') // Replace non-alphanumeric with hyphens
    .toLowerCase()
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

  // Add timestamp to ensure uniqueness
  const timestamp = Date.now().toString(36).slice(-4);
  return `${baseSlug}-${timestamp}`.slice(0, 100); // Max 100 chars
}
