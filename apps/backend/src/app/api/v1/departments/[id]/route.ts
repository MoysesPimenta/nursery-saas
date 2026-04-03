import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/rbac';
import { getUserClient, errorResponse, successResponse, validateUUID } from '@/lib/api/helpers';

const updateDepartmentSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
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
      .is('deleted_at', null)
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
  return requireAuth(async (req: NextRequest, user) => {
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
      .update(validatedData)
      .eq('id', id)
      .is('deleted_at', null)
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

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return requireAuth(async (req: NextRequest, user) => {
  try {
    const { id } = params;

    if (!validateUUID(id)) {
      return errorResponse('Invalid department ID format', 400);
    }

    const supabase = getUserClient(req);

    // Soft delete by setting deleted_at
    const { data, error } = await supabase
      .from('departments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null)
      .select()
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
