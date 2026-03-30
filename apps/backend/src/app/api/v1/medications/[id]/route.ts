import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserClient, errorResponse, successResponse } from '@/lib/api/helpers';

const updateMedicationSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  strength: z.string().optional(),
  form: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getUserClient(req);
    const { id } = params;

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
    return errorResponse(message, error instanceof Error && error.message.includes('Unauthorized') ? 401 : 500);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getUserClient(req);
    const { id } = params;
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
    return errorResponse(message, error instanceof Error && error.message.includes('Unauthorized') ? 401 : 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getUserClient(req);
    const { id } = params;

    const { data, error } = await supabase
      .from('medications')
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
