import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth, requirePermission } from '@/lib/auth/rbac';
import { getUserClient, errorResponse, successResponse, validateUUID } from '@/lib/api/helpers';

const updateAuthorizationSchema = z.object({
  status: z.enum(['pending', 'accepted', 'rejected', 'cancelled']).optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  notes: z.string().optional(),
  symptoms: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
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
        .select('*, children(first_name, last_name)')
        .eq('id', id)
        .single();

      if (error) {
        return errorResponse(error.message, error.code === 'PGRST116' ? 404 : 400);
      }

      return successResponse(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return errorResponse(message, 500);
    }
  })(req);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return requirePermission('manage_authorizations', async (req: NextRequest, user) => {
    try {
      const { id } = params;
      if (!validateUUID(id)) {
        return errorResponse('Invalid authorization ID format', 400);
      }

      const supabase = getUserClient(req);
      const body = await req.json();
      const validatedData = updateAuthorizationSchema.parse(body);

      // Auto-fill response metadata when status changes
      const updateData: Record<string, unknown> = { ...validatedData, updated_at: new Date().toISOString() };
      if (validatedData.status === 'accepted' || validatedData.status === 'rejected') {
        updateData.responded_at = new Date().toISOString();
        updateData.responded_by = user.id;
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
      return errorResponse(message, 500);
    }
  })(req);
}
