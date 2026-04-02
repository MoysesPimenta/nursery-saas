import { NextRequest, NextResponse } from 'next/server';
import { signupRequestSchema } from '@/lib/validation/auth-schemas';
import { handleSignup } from '@/lib/auth/signup-handler';

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

    const result = await handleSignup(parseResult.data);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    const message = error instanceof Error ? error.message : 'Signup failed';

    // Check for duplicate email
    if (message.includes('already been registered') || message.includes('already exists')) {
      return NextResponse.json(
        { error: 'An account with this email already exists', code: 'EMAIL_EXISTS' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: message, code: 'SIGNUP_FAILED' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(): Promise<NextResponse> {
  return NextResponse.json({}, { status: 200 });
}
