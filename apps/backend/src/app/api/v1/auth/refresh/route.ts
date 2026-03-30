import { NextRequest, NextResponse } from 'next/server';
import { refreshTokenRequestSchema } from '@/lib/validation/auth-schemas';
import { getSupabaseServerClient } from '@/lib/supabase/server';

/**
 * POST /api/v1/auth/refresh
 * Refresh an expired access token using a refresh token
 *
 * Request body:
 * {
 *   refreshToken: string
 * }
 *
 * Response:
 * {
 *   accessToken: string
 *   expiresIn: number
 *   expiresAt: number
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    // Validate request payload
    const parseResult = refreshTokenRequestSchema.safeParse(body);
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

    const { refreshToken } = parseResult.data;

    // Use Supabase to refresh the session
    const adminClient = getSupabaseServerClient();
    const { data, error } = await adminClient.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      return NextResponse.json(
        {
          error: 'Invalid or expired refresh token',
          code: 'REFRESH_FAILED',
        },
        { status: 401 }
      );
    }

    // Return new access token
    return NextResponse.json(
      {
        accessToken: data.session.access_token,
        expiresIn: data.session.expires_in,
        expiresAt: Math.floor(Date.now() / 1000) + data.session.expires_in,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Refresh endpoint error:', error);

    const message = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: message || 'An error occurred during token refresh',
        code: 'REFRESH_ERROR',
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/v1/auth/refresh
 * Handle CORS preflight requests
 */
export async function OPTIONS(): Promise<NextResponse> {
  return NextResponse.json({}, { status: 200 });
}
