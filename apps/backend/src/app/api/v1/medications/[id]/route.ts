import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, requirePermission } from '@/lib/auth/rbac';
import { getUserClient, errorResponse, successResponse, validateUUID } from '@/lib/api/helpers';

const updateMedicationSchema = z.object({
  name: z.string().min(1).optional(),
  generic_name: z.string().optional().nullable(),
  dosage_form: z.string().optional().nullable(),
  default_dosage: z.string().optional().nullable(),
  instructions: z.string().optional().nullable(),
  requires_authorization: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return requireAuth(async (req: NextRequest, user) => {
    try {
      const { id } = params;
      if (!validateUUID(id)) {
        return errorResponse('Invalid medication ID format', 400);
      }

      const supabase = getUserClient(req);
      const { data, error } = await supabase
        .from('medications')
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
  return requirePermission('manage_medications', async (req: NextRequest, user) => {
    try {
      const { id } = params;
      if (!validateUUID(id)) {
        return errorResponse('Invalid medication ID format', 400);
      }

      const supabase = getUserClient(req);
      const body = await req.json();
      const validatedData = updateMedicationSchema.parse(body);

      const { data, error } = await supabase
        .from('medications')
        .update(validatedData)
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
  return requirePermission('manage_medications', async (req: NextRequest, user) => {
    try {
      const { id } = params;
      if (!validateUUID(id)) {
        return errorResponse('Invalid medication ID format', 400);
      }

      const supabase = getUserClient(req);
      // Soft delete by deactivating
      const { data, error } = await supabase
        .from('medications')
        .update({ is_active: false })
        .eq('id', id)
        .select()
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
