import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserClient, errorResponse, successResponse } from '@/lib/api/helpers';

const updateVisitSchema = z.object({
  reason: z.string().min(1).optional(),
  notes: z.string().optional(),
  ended_at: z.string().datetime().nullable().optional(),
  vitals: z.record(z.unknown()).nullable().optional(),
  medications_administered: z.array(z.object({
    medication_id: z.string().uuid(),
    dosage: z.string().optional(),
    administration_time: z.string().datetime().optional(),
  })).optional(),
  disposition: z.enum(['sent_home', 'continue_school', 'referred_to_er', 'other']).optional(),
  disposition_notes: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getUserClient(req);
    const { id } = params;

    const { data: visit, error: visitError } = await supabase
      .from('visits')
      .select('*')
      .eq('id', id)
      .single();

    if (visitError) {
      return errorResponse(visitError.message, visitError.code === 'PGRST116' ? 404 : 400);
    }

    // Get child details
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('*')
      .eq('id', visit.child_id)
      .single();

    const visitWithDetails = {
      ...visit,
      child: child || null,
    };

    return successResponse(visitWithDetails);
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

    const validatedData = updateVisitSchema.parse(body);

    // If ended_at is being set and no disposition provided, validate
    if (validatedData.ended_at && !validatedData.disposition) {
      return errorResponse('Disposition is required when ending a visit', 400);
    }

    const { data, error } = await supabase
      .from('visits')
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
