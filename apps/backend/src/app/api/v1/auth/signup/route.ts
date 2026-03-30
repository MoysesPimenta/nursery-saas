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

    // Check if email already exists
    const adminClient = getSupabaseServerClient();
    const { data: existingUser } = await adminClient.auth.admin.listUsers();
    const emailExists = existingUser?.users?.some(u => u.email === payload.email);

    if (emailExists) {
      return NextResponse.json(
        {
          error: 'Email already registered',
          code: 'EMAIL_EXISTS',
        },
        { status: 409 }
      );
    }

    // Handle signup (create auth user, tenant, user profile, assign role)
    const response = await handleSignup(payload);

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Signup endpoint error:', error);

    const message = error instanceof Error ? error.message : 'Unknown error';

    // Check for specific error cases
    if (message.includes('Email already registered')) {
      return NextResponse.json(
        {
          error: 'Email already registered',
          code: 'EMAIL_EXISTS',
        },
        { status: 409 }
      );
    }

    if (message.includes('Failed to create')) {
      return NextResponse.json(
        {
          error: 'Failed to complete signup. Please try again.',
          code: 'SIGNUP_FAILED',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'An error occurred during signup',
        code: 'SIGNUP_ERROR',
      },
      { status: 500 }
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
