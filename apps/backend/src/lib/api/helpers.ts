import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Extract JWT token from Authorization header and create authenticated Supabase client
 * The client will use RLS to enforce tenant isolation based on the user's JWT claims
 */
export function getUserClient(req: NextRequest): SupabaseClient {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    throw new Error('Unauthorized: Missing or invalid authorization token');
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/**
 * Parse pagination parameters from request query string
 * Returns {from, to} for use with Supabase range() method
 */
export function parsePagination(req: NextRequest): { from: number; to: number; page: number; limit: number } {
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return { from, to, page, limit };
}

/**
 * Create a standardized error response
 */
export function errorResponse(message: string, status: number = 400): NextResponse {
  return NextResponse.json(
    {
      error: message,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * Create a standardized success response
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

/**
 * Create a paginated response with metadata
 */
export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
    { status }
  );
}

/**
 * Extract search query from request
 */
export function getSearchQuery(req: NextRequest): string | null {
  const url = new URL(req.url);
  return url.searchParams.get('search') || null;
}

/**
 * Validate if a string is a valid UUID v4
 */
export function validateUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Sanitize search input to escape SQL LIKE wildcards
 */
export function sanitizeSearchInput(input: string): string {
  return input.replace(/[%_\\]/g, '\\$&');
}

/**
 * Extract filter parameters from request
 */
export function getFilterParams(
  req: NextRequest,
  allowedFilters: string[]
): Record<string, string | null> {
  const url = new URL(req.url);
  const filters: Record<string, string | null> = {};

  for (const filter of allowedFilters) {
    filters[filter] = url.searchParams.get(filter) || null;
  }

  return filters;
}
