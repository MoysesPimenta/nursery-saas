import { z } from 'zod';

/**
 * Authentication and authorization validation schemas
 */

// Email validation
const emailSchema = z.string().email().toLowerCase();

// Password validation (minimum 6 chars)
const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters');

// Tenant slug validation
const tenantSlugSchema = z
  .string()
  .min(3, 'Tenant slug must be at least 3 characters')
  .max(50, 'Tenant slug must be at most 50 characters')
  .regex(/^[a-z0-9-]+$/, 'Tenant slug can only contain lowercase letters, numbers, and hyphens')
  .toLowerCase();

/**
 * Sign up request schema
 */
export const signupRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1, 'First name is required').max(255),
  lastName: z.string().min(1, 'Last name is required').max(255),
});

export type SignupRequest = z.infer<typeof signupRequestSchema>;

/**
 * Sign up response schema
 */
export const signupResponseSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    email: z.string(),
    fullName: z.string(),
    tenantId: z.string().uuid(),
    roles: z.array(z.string()),
  }),
  message: z.string(),
});

export type SignupResponse = z.infer<typeof signupResponseSchema>;

/**
 * Login request schema
 */
export const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

/**
 * Login response schema
 */
export const loginResponseSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    email: emailSchema,
    tenantId: z.string().uuid(),
    roles: z.array(z.string()),
    permissions: z.array(z.string()),
  }),
  session: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    expiresIn: z.number(),
    expiresAt: z.number(),
  }),
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;

/**
 * Refresh token request schema
 */
export const refreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RefreshTokenRequest = z.infer<typeof refreshTokenRequestSchema>;

/**
 * Refresh token response schema
 */
export const refreshTokenResponseSchema = z.object({
  accessToken: z.string(),
  expiresIn: z.number(),
  expiresAt: z.number(),
});

export type RefreshTokenResponse = z.infer<typeof refreshTokenResponseSchema>;

/**
 * User profile schema
 */
export const userProfileSchema = z.object({
  id: z.string().uuid(),
  email: emailSchema,
  fullName: z.string(),
  tenantId: z.string().uuid(),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;

/**
 * Error response schema
 */
export const errorResponseSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
  details: z.record(z.string()).optional(),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;
