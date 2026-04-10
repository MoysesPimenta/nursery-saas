import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, requirePermission } from '@/lib/auth/rbac';
import { getUserClient, errorResponse, successResponse, validateUUID } from '@/lib/api/helpers';

const updateDepartmentSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  head_id: z.string().uuid().optional().nullable(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return requireAuth(async (req: NextRequest, user) => {
    try {
      const { id } = params;
      if (!validateUUID(id)) {
        return errorResponse('Invalid department ID format', 400);
      }

      const supabase = getUserClient(req);
      const { data, error } = await supabase
        .from('departments')
        .select('*')
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
  return requirePermission('manage_departments', async (req: NextRequest, user) => {
    try {
      const { id } = params;
      if (!validateUUID(id)) {
        return errorResponse('Invalid department ID format', 400);
      }

      const supabase = getUserClient(req);
      const body = await req.json();
      const validatedData = updateDepartmentSchema.parse(body);

      const { data, error } = await supabase
        .from('departments')
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

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return requirePermission('manage_departments', async (req: NextRequest, user) => {
    try {
      const { id } = params;
      if (!validateUUID(id)) {
        return errorResponse('Invalid department ID format', 400);
      }

      const supabase = getUserClient(req);
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', id);

      if (error) {
        return errorResponse(error.message, 400);
      }

      return NextResponse.json({ message: 'Department deleted successfully' }, { status: 200 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return errorResponse(message, 500);
    }
  })(req);
}
