import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractBearerToken, AuthUser } from './verify-token';

/**
 * Role-Based Access Control (RBAC) middleware and helpers
 * Defines permissions, verifies auth, and authorizes actions
 */

export type Permission =
  | 'read:children'
  | 'write:children'
  | 'delete:children'
  | 'create:children'
  | 'manage:children'
  | 'read:employees'
  | 'write:employees'
  | 'delete:employees'
  | 'create:employees'
  | 'manage:employees'
  | 'read:visits'
  | 'write:visits'
  | 'delete:visits'
  | 'create:visits'
  | 'manage:visits'
  | 'read:authorizations'
  | 'write:authorizations'
  | 'delete:authorizations'
  | 'manage:authorizations'
  | 'manage:tenant'
  | 'manage:billing'
  | 'manage:users'
  | 'manage:classes'
  | 'manage:departments'
  | 'manage:allergies'
  | 'manage:medications';

/**
 * Requires authentication on an API handler
 * Extracts token from Authorization header and verifies it
 * Passes the authenticated user to the handler
 *
 * @example
 * export const POST = requireAuth(async (req, user) => {
 *   // user is guaranteed to be authenticated
 *   return NextResponse.json({ success: true });
 * });
 */
export function requireAuth(
  handler: (
    req: NextRequest,
    user: AuthUser
  ) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const authHeader = req.headers.get('authorization');
    const token = extractBearerToken(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const user = await verifyToken(token);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    try {
      return await handler(req, user);
    } catch (error) {
      console.error('Error in authenticated handler:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Requires specific permission on an API handler
 * First verifies authentication, then checks permission
 *
 * @example
 * export const DELETE = requirePermission('delete:children', async (req, user) => {
 *   // user is guaranteed to have 'delete:children' permission
 *   return NextResponse.json({ success: true });
 * });
 */
export function requirePermission(
  permission: Permission,
  handler: (
    req: NextRequest,
    user: AuthUser
  ) => Promise<NextResponse>
) {
  return requireAuth(async (req, user) => {
    // Check if user has the required permission
    if (!user.permissions.includes(permission)) {
      return NextResponse.json(
        { error: `Missing required permission: ${permission}` },
        { status: 403 }
      );
    }

    return handler(req, user);
  });
}

/**
 * Requires specific role on an API handler
 * First verifies authentication, then checks role
 *
 * @example
 * export const POST = requireRole('admin', async (req, user) => {
 *   // user is guaranteed to have 'admin' role
 *   return NextResponse.json({ success: true });
 * });
 */
export function requireRole(
  role: string,
  handler: (
    req: NextRequest,
    user: AuthUser
  ) => Promise<NextResponse>
) {
  return requireAuth(async (req, user) => {
    // Check if user has the required role
    if (!user.roles.includes(role)) {
      return NextResponse.json(
        { error: `Missing required role: ${role}` },
        { status: 403 }
      );
    }

    return handler(req, user);
  });
}

/**
 * Check if a user has a specific permission
 * Useful for conditional logic within handlers
 */
export function hasPermission(user: AuthUser, permission: Permission): boolean {
  return user.permissions.includes(permission);
}

/**
 * Check if a user has a specific role
 * Useful for conditional logic within handlers
 */
export function hasRole(user: AuthUser, role: string): boolean {
  return user.roles.includes(role);
}

/**
 * Throw an error if user doesn't have required permission
 * Useful for conditional authorization within handlers
 */
export function checkPermissionOrThrow(
  user: AuthUser,
  permission: Permission
): void {
  if (!hasPermission(user, permission)) {
    throw new Error(`Forbidden: missing required permission '${permission}'`);
  }
}

/**
 * Throw an error if user doesn't have required role
 * Useful for conditional authorization within handlers
 */
export function checkRoleOrThrow(user: AuthUser, role: string): void {
  if (!hasRole(user, role)) {
    throw new Error(`Forbidden: missing required role '${role}'`);
  }
}
