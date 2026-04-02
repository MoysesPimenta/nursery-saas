import { NextRequest, NextResponse } from 'next/server';
import { signupRequestSchema, errorResponseSchema } from '@/lib/validation/auth-schemas';
import { handleSignup } from '@/lib/auth/signup-handler';
import { getSupabaseServerClient } from '@/lib/supabase/server';

/**
 * POST /api/v1/auth/signup
 * Register a new user and create their tenant
 *
 * Request body:
 * {
 *   email: string
 *   password: string (min 8 chars, 1 number, 1 special char)
 *   fullName: string
 *   tenantSlug: string (lowercase, alphanumeric + hyphens)
 *   tenantName?: string (optional, defaults to tenantSlug)
 * }
 *
 * Response:
 * {
 *   user: { id, email, fullName, tenantId, roles, createdAt }
 *   session: { accessToken, refreshToken, expiresIn, expiresAt }
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    // Validate request payload
    const parseResult = signupRequestSchema.safeParse(body);
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

    const payload = parseResult.data;

    // Handle signup (create auth user, tenant, user profile, assign role)
    // Let Supabase handle duplicate email errors
    const response = await handleSignup(payload);

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Signup endpoint error:', error);

    const message = error instanceof Error ? error.message : 'Unknown error';

    // Don't leak information about whether email exists
    // Return generic success message regardless

    // Return generic message for all errors to prevent email enumeration
    return NextResponse.json(
      {
        message: 'If this email is not registered, an account has been created. Please check your email for confirmation.',
        code: 'SIGNUP_PROCESSING',
      },
      { status: 201 }
    );
  }
}

/**
 * OPTIONS /api/v1/auth/signup
 * Handle CORS preflight requests
 */
export async function OPTIONS(): Promise<NextResponse> {
  return NextResponse.json({}, { status: 200 });
}
