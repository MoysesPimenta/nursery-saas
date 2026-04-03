import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, requirePermission } from '@/lib/auth/rbac';
import { getUserClient, errorResponse, successResponse, validateUUID } from '@/lib/api/helpers';

const updateAuthorizationSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  notes: z.string().optional(),
  reviewed_at: z.string().datetime().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return requireAuth(async (req: NextRequest, user) => {
  try {
    const { id } = params;

    if (!validateUUID(id)) {
      return errorResponse('Invalid authorization ID format', 400);
    }

    const supabase = getUserClient(req);

    const { data, error } = await supabase
      .from('authorizations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return errorResponse(error.message, error.code === 'PGRST116' ? 404 : 400);
    }

    return successResponse(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, error instanceof Error && error.message.includes('Unauthorized') ? 401 : 500);
  }
  })(req);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return requirePermission('manage:authorizations', async (req: NextRequest, user) => {
  try {
    const { id } = params;

    if (!validateUUID(id)) {
      return errorResponse('Invalid authorization ID format', 400);
    }

    const supabase = getUserClient(req);
    const body = await req.json();

    const validatedData = updateAuthorizationSchema.parse(body);

    // Add reviewed_at timestamp if status is being changed to approved or rejected
    let updateData = { ...validatedData };
    if ((validatedData.status === 'approved' || validatedData.status === 'rejected') && !validatedData.reviewed_at) {
      updateData.reviewed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('authorizations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return errorResponse(error.message, error.code === 'PGRST116' ? 404 : 400);
    }

    return successResponse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(
        `Validation error: ${error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        400
      );
    }
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, error instanceof Error && error.message.includes('Unauthorized') ? 401 : 500);
  }
  })(req);
}
