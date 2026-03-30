/**
 * Type definitions for authentication and RBAC system
 */

/**
 * Authenticated user object returned by verifyToken()
 * Contains user identity, tenant association, and authorization data
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
 * JWT payload from Supabase Auth
 * Contains basic user information and token metadata
 */
export interface JWTPayload {
  sub: string; // user ID
  email?: string;
  iss?: string; // issuer
  aud?: string; // audience
  exp?: number; // expiration time (seconds)
  iat?: number; // issued at (seconds)
  email_verified?: boolean;
}

/**
 * User data from public.users table
 */
export interface UserRecord {
  id: string;
  email: string;
  full_name: string | null;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * User role record from user_roles table with relation
 */
export interface UserRoleRecord {
  user_id: string;
  tenant_id: string;
  role_id: string;
  roles?: {
    name: string;
  };
  created_at: string;
}

/**
 * Permission record from permissions table
 */
export interface PermissionRecord {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

/**
 * Role record from roles table
 */
export interface RoleRecord {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Role permission record from role_permissions table with relation
 */
export interface RolePermissionRecord {
  role_id: string;
  permission_id: string;
  permissions?: {
    name: string;
  };
  created_at: string;
}

/**
 * Session object returned on login/signup
 * Contains tokens and expiration information
 */
export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
  expiresAt: number; // unix timestamp
}

/**
 * Standard API error response
 */
export interface ApiError {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * Tenant record from tenants table
 */
export interface TenantRecord {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  phone?: string | null;
  email?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Sign up request payload
 */
export interface SignupPayload {
  email: string;
  password: string;
  fullName: string;
  tenantSlug: string;
  tenantName?: string;
}

/**
 * Sign up response
 */
export interface SignupResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    tenantId: string;
    roles: string[];
    createdAt: string;
  };
  session: AuthSession;
}

/**
 * Login request payload
 */
export interface LoginPayload {
  email: string;
  password: string;
}

/**
 * Login response with user roles and permissions
 */
export interface LoginResponse {
  user: Omit<AuthUser, 'fullName'>;
  session: AuthSession;
}

/**
 * Refresh token request payload
 */
export interface RefreshTokenPayload {
  refreshToken: string;
}

/**
 * Refresh token response
 */
export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
  expiresAt: number;
}

/**
 * Available permission types for RBAC
 */
export type Permission =
  | 'read:children'
  | 'write:children'
  | 'delete:children'
  | 'read:employees'
  | 'write:employees'
  | 'delete:employees'
  | 'read:visits'
  | 'write:visits'
  | 'delete:visits'
  | 'read:authorizations'
  | 'write:authorizations'
  | 'delete:authorizations'
  | 'manage:tenant'
  | 'manage:billing'
  | 'manage:users';

/**
 * Common role types
 */
export type RoleType =
  | 'super_admin'
  | 'admin'
  | 'manager'
  | 'employee'
  | 'parent'
  | 'user_member'
  | 'guest';

/**
 * Audit log record
 */
export interface AuditLogRecord {
  id: string;
  user_id: string;
  tenant_id: string;
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
  resource: string;
  resource_id?: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Rate limit entry in store
 */
export interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * Rate limit info
 */
export interface RateLimitInfo {
  key: string;
  limit: number;
  window: number; // milliseconds
  isLimited: boolean;
}
