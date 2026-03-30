import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserClient, errorResponse, successResponse } from '@/lib/api/helpers';

const updateAllergySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  severity: z.enum(['mild', 'moderate', 'severe']).optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getUserClient(req);
    const { id } = params;

    const { data, error } = await supabase
      .from('allergies')
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
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getUserClient(req);
    const { id } = params;
    const body = await req.json();

    const validatedData = updateAllergySchema.parse(body);

    const { data, error } = await supabase
      .from('allergies')
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
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getUserClient(req);
    const { id } = params;

    const { data, error } = await supabase
      .from('allergies')
      .delete()
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
}
