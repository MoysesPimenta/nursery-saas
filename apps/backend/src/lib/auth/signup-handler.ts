import { getSupabaseServerClient } from '../supabase/server';
import { SignupRequest, SignupResponse } from '../validation/auth-schemas';

const DEFAULT_TENANT_ID = '0c5d9490-f9ca-4ea4-8bf1-ee832fd1410e';
const DEFAULT_ROLE_ID = '4d9869e5-632d-46ba-a729-095af0e7c9e5'; // school_admin

export async function handleSignup(payload: SignupRequest): Promise<SignupResponse> {
  const adminClient = getSupabaseServerClient();
  const fullName = `${payload.firstName} ${payload.lastName}`;

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
    // Step 2: Create user profile in public.users
    const { error: userError } = await adminClient
      .from('users')
      .insert({
        id: userId,
        email: payload.email,
        full_name: fullName,
        tenant_id: DEFAULT_TENANT_ID,
        is_active: true,
      });

    if (userError) {
      // Cleanup: delete auth user on failure
      await adminClient.auth.admin.deleteUser(userId);
      throw new Error(`Failed to create user profile: ${userError.message}`);
    }

    // Step 3: Assign default role
    const { error: roleError } = await adminClient
      .from('user_roles')
      .insert({
        user_id: userId,
        role_id: DEFAULT_ROLE_ID,
        tenant_id: DEFAULT_TENANT_ID,
      });

    if (roleError) {
      console.error('Failed to assign role:', roleError.message);
      // Don't fail signup if role assignment fails
    }

    return {
      user: {
        id: userId,
        email: payload.email,
        fullName,
        tenantId: DEFAULT_TENANT_ID,
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
