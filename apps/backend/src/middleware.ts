import { NextRequest, NextResponse } from 'next/server';
import { extractBearerToken, decodeJWTPayload } from './lib/auth/verify-token';

/**
 * Next.js middleware for:
 * - Rate limiting (per user and per IP)
 * - Authentication checks on protected routes
 * - Request logging
 * - Security headers
 */

// Simple in-memory rate limit store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_PER_USER = parseInt(process.env.RATE_LIMIT_PER_USER || '100', 10);
const RATE_LIMIT_PER_IP = parseInt(process.env.RATE_LIMIT_PER_IP || '200', 10);

/**
 * Public routes that don't require authentication
 */
const PUBLIC_ROUTES = [
  '/api/v1/health',
  '/api/v1/auth/signup',
  '/api/v1/auth/login',
  '/api/v1/auth/refresh',
  '/',
];

/**
 * Routes that should be skipped from middleware processing
 */
const SKIP_ROUTES = [
  '/_next/static',
  '/_next/image',
  '/favicon.ico',
];

/**
 * Main middleware function
 */
export function middleware(request: NextRequest) {
  // Skip middleware for static files and images
  if (SKIP_ROUTES.some(route => request.nextUrl.pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Get client IP
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const userId = extractUserIdFromRequest(request);

  // Check rate limits
  if (!isPublicRoute(request.nextUrl.pathname)) {
    // Rate limit by user (if authenticated)
    if (userId && isRateLimited(userId, RATE_LIMIT_PER_USER)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429 }
      );
    }

    // Rate limit by IP
    if (isRateLimited(ip, RATE_LIMIT_PER_IP)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429 }
      );
    }
  }

  // Check authentication on protected routes
  if (!isPublicRoute(request.nextUrl.pathname)) {
    const authHeader = request.headers.get('authorization');
    const token = extractBearerToken(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: 'Missing authentication token', code: 'MISSING_AUTH' },
        { status: 401 }
      );
    }

    // Verify token is not expired (basic check)
    const payload = decodeJWTPayload(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid authentication token', code: 'INVALID_AUTH' },
        { status: 401 }
      );
    }

    // Check token expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return NextResponse.json(
        { error: 'Token expired', code: 'TOKEN_EXPIRED' },
        { status: 401 }
      );
    }
  }

  const response = NextResponse.next();

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Add CORS headers (adjust origin as needed)
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || 'http://localhost:3000');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');

  return response;
}

/**
 * Extract user ID from JWT token in Authorization header
 */
function extractUserIdFromRequest(request: NextRequest): string | null {
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractBearerToken(authHeader);

    if (!token) return null;

    const payload = decodeJWTPayload(token);
    return payload?.sub || null;
  } catch (error) {
    return null;
  }
}

/**
 * Check if a route is public (doesn't require authentication)
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => {
    if (route === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(route);
  });
}

/**
 * Check if a request has exceeded rate limit
 * Simple in-memory implementation - use Redis in production
 */
function isRateLimited(key: string, limit: number): boolean {
  if (!key) return false;

  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetTime < now) {
    // New or expired entry
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }

  entry.count++;
  return entry.count > limit;
}

/**
 * Clean up old rate limit entries periodically (every 5 minutes)
 */
function cleanupRateLimiter() {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`Cleaned up ${cleaned} rate limit entries`);
  }
}

// Run cleanup every 5 minutes
if (typeof global !== 'undefined') {
  const CLEANUP_INTERVAL = 5 * 60 * 1000;
  if (!(global as any).__rateLimitCleanupInterval) {
    (global as any).__rateLimitCleanupInterval = setInterval(() => {
      cleanupRateLimiter();
    }, CLEANUP_INTERVAL);
  }
}

/**
 * Configure which routes should use middleware
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
