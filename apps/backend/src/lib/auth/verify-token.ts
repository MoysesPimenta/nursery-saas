import { getSupabaseServerClient } from '../supabase/server';

/**
 * Authentication user interface with roles and permissions
 */
export interface AuthUser {
  id: string;
  email: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
  fullName?: string;
}

/**
 * JWT payload interface (from Supabase Auth)
 */
interface JWTPayload {
  sub: string; // user ID
  email?: string;
  iss?: string;
  aud?: string;
  exp?: number;
  iat?: number;
  email_verified?: boolean;
}

/**
 * Extract and decode JWT payload without verification (used to get user ID)
 * Note: This doesn't verify the token signature, only extracts the payload
 * Signature verification happens when we call Supabase APIs with the token
 */
export function decodeJWTPayload(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payloadB64 = parts[1];
    const padding = '='.repeat((4 - (payloadB64.length % 4)) % 4);
    const padded = payloadB64 + padding;
    const payload = Buffer.from(padded, 'base64').toString('utf-8');
    return JSON.parse(payload);
  } catch (error) {
    console.error('Failed to decode JWT payload:', error);
    return null;
  }
}

/**
 * Verify a Supabase JWT token and fetch the user's complete auth profile
 * including roles and permissions from the database
 *
 * This function:
 * 1. Decodes the JWT to extract the user ID
 * 2. Verifies the token is valid by fetching the user from Supabase Auth
 * 3. Fetches the user's tenant, roles, and permissions from the database
 *
 * @param token - The JWT token from the Authorization header
 * @returns AuthUser object with roles and permissions, or null if invalid
 */
export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    if (!token || typeof token !== 'string') {
      return null;
    }

    // Use admin client to verify the token directly
    // This avoids the setSession race condition entirely
    const adminClient = getSupabaseServerClient();

    // Verify token by passing it directly to getUser
    const { data: { user }, error: authError } = await adminClient.auth.getUser(token);

    if (authError || !user) {
      console.error('Token verification failed:', authError?.message);
      return null;
    }

    // Fetch user's tenant and full name
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('tenant_id, full_name')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      console.error('Failed to fetch user data:', userError?.message);
      return null;
    }

    // Fetch user's roles for this tenant
    const { data: roleData, error: roleError } = await adminClient
      .from('user_roles')
      .select('role_id, roles(name)')
      .eq('user_id', user.id)
      .eq('tenant_id', userData.tenant_id);

    if (roleError) {
      console.error('Failed to fetch user roles:', roleError.message);
      return null;
    }

    const roles = roleData
      ?.map((r: any) => r.roles?.name)
      .filter(Boolean) || [];

    // Fetch permissions for all user roles
    const roleIds = roleData?.map((r: any) => r.role_id).filter(Boolean) || [];
    let permissions: string[] = [];

    if (roleIds.length > 0) {
      const { data: permData, error: permError } = await adminClient
        .from('role_permissions')
        .select('permissions(name)')
        .in('role_id', roleIds);

      if (permError) {
        console.error('Failed to fetch role permissions:', permError.message);
      } else {
        // Deduplicate permissions
        permissions = [...new Set(
          permData?.map((p: any) => p.permissions?.name).filter(Boolean) || []
        )] as string[];
      }
    }

    return {
      id: user.id,
      email: user.email || '',
      tenantId: userData.tenant_id,
      roles,
      permissions,
      fullName: userData.full_name || undefined,
    };
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

/**
 * Extract bearer token from Authorization header
 * @param authHeader - The Authorization header value (e.g., "Bearer <token>")
 * @returns The token without "Bearer " prefix, or null if invalid
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  if (!authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}
