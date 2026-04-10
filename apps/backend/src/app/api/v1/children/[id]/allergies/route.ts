import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, requirePermission } from '@/lib/auth/rbac';
import { getUserClient, errorResponse, successResponse, validateUUID } from '@/lib/api/helpers';

const linkAllergySchema = z.object({
  allergy_id: z.string().uuid('Invalid allergy ID format'),
  reaction_description: z.string().optional(),
  diagnosed_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return requireAuth(async (req: NextRequest, user) => {
    try {
      const { id } = params;

      if (!validateUUID(id)) {
        return errorResponse('Invalid child ID format', 400);
      }

      const supabase = getUserClient(req);

      // Get all allergies for the child with full allergy details
      const { data, error } = await supabase
        .from('child_allergies')
        .select('id, reaction_description, diagnosed_date, notes, allergies(id, name, severity_level, description)')
        .eq('child_id', id);

      if (error) {
        return errorResponse(error.message, 400);
      }

      // Transform the response to include full allergy data at top level
      const allergies = data?.map((item: any) => ({
        child_allergy_id: item.id,
        allergy_id: item.allergies?.id,
        name: item.allergies?.name,
        severity_level: item.allergies?.severity_level,
        description: item.allergies?.description,
        reaction_description: item.reaction_description,
        diagnosed_date: item.diagnosed_date,
        notes: item.notes,
      })) || [];

      return successResponse(allergies);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return errorResponse(message, error instanceof Error && error.message.includes('Unauthorized') ? 401 : 500);
    }
  })(req);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return requirePermission('manage_children', async (req: NextRequest, user) => {
    try {
      const { id } = params;

      if (!validateUUID(id)) {
        return errorResponse('Invalid child ID format', 400);
      }

      const supabase = getUserClient(req);
      const body = await req.json();

      const validatedData = linkAllergySchema.parse(body);

      // Insert the child allergy record
      const { data, error } = await supabase
        .from('child_allergies')
        .insert({
          child_id: id,
          allergy_id: validatedData.allergy_id,
          reaction_description: validatedData.reaction_description || null,
          diagnosed_date: validatedData.diagnosed_date || null,
          notes: validatedData.notes || null,
        })
        .select('id, reaction_description, diagnosed_date, notes, allergies(id, name, severity_level, description)')
        .single();

      if (error) {
        // Handle duplicate allergy assignment
        if (error.code === '23505') {
          return errorResponse('This allergy is already linked to this child', 409);
        }
        return errorResponse(error.message, 400);
      }

      const result = {
        child_allergy_id: data.id,
        allergy_id: data.allergies?.id,
        name: data.allergies?.name,
        severity_level: data.allergies?.severity_level,
        description: data.allergies?.description,
        reaction_description: data.reaction_description,
        diagnosed_date: data.diagnosed_date,
        notes: data.notes,
      };

      return successResponse(result, 201);
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

      const url = new URL(req.url);
      const allergyId = url.searchParams.get('allergy_id');

      if (!allergyId || !validateUUID(allergyId)) {
        return errorResponse('Invalid or missing allergy_id parameter', 400);
      }

      const supabase = getUserClient(req);

      // Delete the child allergy record
      const { data, error } = await supabase
        .from('child_allergies')
        .delete()
        .eq('child_id', id)
        .eq('allergy_id', allergyId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return errorResponse('Allergy not found for this child', 404);
        }
        return errorResponse(error.message, 400);
      }

      return successResponse({ message: 'Allergy removed from child', id: data.id });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return errorResponse(message, error instanceof Error && error.message.includes('Unauthorized') ? 401 : 500);
    }
  })(req);
}
