import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, requirePermission } from '@/lib/auth/rbac';
import { getUserClient, errorResponse, successResponse, validateUUID } from '@/lib/api/helpers';

const updateVisitSchema = z.object({
  chief_complaint: z.string().optional(),
  assessment: z.string().optional(),
  treatment: z.string().optional(),
  vitals: z.record(z.unknown()).nullable().optional(),
  medications_administered: z.array(z.record(z.unknown())).nullable().optional(),
  disposition: z.string().optional().nullable(),
  parent_notified: z.boolean().optional(),
  parent_notified_at: z.string().datetime().optional().nullable(),
  ended_at: z.string().datetime().nullable().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return requireAuth(async (req: NextRequest, user) => {
    try {
      const { id } = params;
      if (!validateUUID(id)) {
        return errorResponse('Invalid visit ID format', 400);
      }

      const supabase = getUserClient(req);
      const { data: visit, error: visitError } = await supabase
        .from('visits')
        .select('*')
        .eq('id', id)
        .single();

      if (visitError) {
        return errorResponse(visitError.message, visitError.code === 'PGRST116' ? 404 : 400);
      }

      // Get child details if child_id exists
      let child = null;
      if (visit.child_id) {
        const { data: childData } = await supabase
          .from('children')
          .select('*')
          .eq('id', visit.child_id)
          .single();
        child = childData;
      }

      return successResponse({ ...visit, child });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return errorResponse(message, 500);
    }
  })(req);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return requirePermission('manage_visits', async (req: NextRequest, user) => {
    try {
      const { id } = params;
      if (!validateUUID(id)) {
        return errorResponse('Invalid visit ID format', 400);
      }

      const supabase = getUserClient(req);
      const body = await req.json();
      const validatedData = updateVisitSchema.parse(body);

      const { data, error } = await supabase
        .from('visits')
        .update({ ...validatedData, updated_at: new Date().toISOString() })
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
