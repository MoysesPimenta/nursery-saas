import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/rbac';

/**
 * GET /api/v1/auth/me
 * Get current authenticated user's profile
 *
 * Requires: Authorization header with Bearer token
 *
 * Response:
 * {
 *   user: { id, email, fullName, tenantId, roles, permissions, createdAt, updatedAt }
 * }
 */
export const GET = requireAuth(async (req, user) => {
  return NextResponse.json(
    {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName || null,
        tenantId: user.tenantId,
        roles: user.roles,
        permissions: user.permissions,
      },
    },
    { status: 200 }
  );
});

/**
 * OPTIONS /api/v1/auth/me
 * Handle CORS preflight requests
 */
export async function OPTIONS(): Promise<NextResponse> {
  return NextResponse.json({}, { status: 200 });
}
