import { NextRequest, NextResponse } from 'next/server';
import { loginRequestSchema } from '@/lib/validation/auth-schemas';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { verifyToken } from '@/lib/auth/verify-token';

/**
 * POST /api/v1/auth/login
 * Authenticate user and return session tokens
 *
 * Request body:
 * {
 *   email: string
 *   password: string
 * }
 *
 * Response:
 * {
 *   user: { id, email, tenantId, roles, permissions }
 *   session: { accessToken, refreshToken, expiresIn, expiresAt }
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    // Validate request payload
    const parseResult = loginRequestSchema.safeParse(body);
    if (!parseResult.success) {
      const errors = parseResult.error.flatten().fieldErrors;
      return NextResponse.json(
        {
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors,
        },
        { status: 400 }
      );
    }

    const { email, password } = parseResult.data;

    // Authenticate with Supabase Auth
    const adminClient = getSupabaseServerClient();
    const { data, error } = await adminClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user || !data.session) {
      return NextResponse.json(
        {
          error: 'Invalid email or password',
          code: 'AUTH_FAILED',
        },
        { status: 401 }
      );
    }

    // Fetch user's tenant, roles, and permissions
    const authUser = await verifyToken(data.session.access_token);

    if (!authUser) {
      return NextResponse.json(
        {
          error: 'Failed to fetch user profile',
          code: 'PROFILE_FETCH_FAILED',
        },
        { status: 500 }
      );
    }

    // Return user info and session tokens
    return NextResponse.json(
      {
        user: {
          id: authUser.id,
          email: authUser.email,
          tenantId: authUser.tenantId,
          roles: authUser.roles,
          permissions: authUser.permissions,
        },
        session: {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresIn: data.session.expires_in,
          expiresAt: Math.floor(Date.now() / 1000) + data.session.expires_in,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login endpoint error:', error);

    const message = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: message || 'An error occurred during login',
        code: 'LOGIN_ERROR',
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/v1/auth/login
 * Handle CORS preflight requests
 */
export async function OPTIONS(): Promise<NextResponse> {
  return NextResponse.json({}, { status: 200 });
}
