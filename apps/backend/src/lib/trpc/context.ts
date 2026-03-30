import { NextRequest } from 'next/server';
import { getSupabaseClientWithAuth } from '@/lib/supabase/server';
import { verifyJWT } from '@/lib/auth/verify-token';

/**
 * tRPC context creation
 * Extracts auth information from request headers and makes it available to tRPC procedures
 */

export async function createTRPCContext(opts: {
  req: NextRequest;
}) {
  const token = extractBearerToken(opts.req);
  let userId: string | null = null;
  let tenantId: string | null = null;

  if (token) {
    try {
      const payload = await verifyJWT(token);
      userId = payload.sub;
      tenantId = payload.tenant_id;
    } catch (error) {
      console.error('JWT verification failed:', error);
    }
  }

  const supabase = token ? getSupabaseClientWithAuth(token) : null;

  return {
    req: opts.req,
    userId,
    tenantId,
    token,
    supabase,
  };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

function extractBearerToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}
