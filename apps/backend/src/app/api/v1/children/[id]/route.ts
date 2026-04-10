import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, requirePermission } from '@/lib/auth/rbac';
import { getUserClient, errorResponse, successResponse, validateUUID } from '@/lib/api/helpers';

const updateChildSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  class_id: z.string().uuid().nullable().optional(),
  notes: z.string().optional(),
  photo_url: z.string().url().nullable().optional(),
  is_archived: z.boolean().optional(),
  gender: z.enum(['M', 'F', 'O', 'Prefer not to say']).optional(),
  blood_type: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relation: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return requireAuth(async (req: NextRequest, user) => {
    try {
      const { id } = params;

    if (!validateUUID(id)) {
      return errorResponse('Invalid child ID format', 400);
    }

    const supabase = getUserClient(req);

    // Get child
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('*')
      .eq('id', id)
      .single();

    if (childError) {
      return errorResponse(childError.message, childError.code === 'PGRST116' ? 404 : 400);
    }

    // Get allergies
    const { data: allergies, error: allergyError } = await supabase
      .from('child_allergies')
      .select('allergies(*)')
      .eq('child_id', id);

    if (allergyError) {
      return errorResponse(allergyError.message, 400);
    }

    // Get medications
    const { data: medications, error: medError } = await supabase
      .from('child_medications')
      .select('medications(*)')
      .eq('child_id', id);

    if (medError) {
      return errorResponse(medError.message, 400);
    }

    const childWithDetails = {
      ...child,
      allergies: allergies?.map((a) => a.allergies) || [],
      medications: medications?.map((m) => m.medications) || [],
    };

    return successResponse(childWithDetails);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, error instanceof Error && error.message.includes('Unauthorized') ? 401 : 500);
    }
  })(req);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return requirePermission('manage_children', async (req: NextRequest, user) => {
  try {
    const { id } = params;

    if (!validateUUID(id)) {
      return errorResponse('Invalid child ID format', 400);
    }

    const supabase = getUserClient(req);
    const body = await req.json();

    const validatedData = updateChildSchema.parse(body);

    const { data, error } = await supabase
      .from('children')
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
    return errorResponse(message, error instanceof Error && error.message.includes('Unauthorized') ? 401 : 500);
    }
  })(req);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return requirePermission('manage_children', async (req: NextRequest, user) => {
  try {
    const { id } = params;

    if (!validateUUID(id)) {
      return errorResponse('Invalid child ID format', 400);
    }

    const supabase = getUserClient(req);

    // Soft delete by setting archived = true
    const { data, error } = await supabase
      .from('children')
      .update({ is_archived: true })
      .eq('id', id)
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
