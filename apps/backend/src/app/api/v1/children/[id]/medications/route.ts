import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth, requirePermission } from '@/lib/auth/rbac';
import { getUserClient, errorResponse, successResponse, validateUUID } from '@/lib/api/helpers';

const linkMedicationSchema = z.object({
  medication_id: z.string().uuid('Invalid medication ID format'),
  dosage: z.string().min(1, 'Dosage is required'),
  frequency: z.string().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').nullable().optional(),
  prescribed_by: z.string().optional(),
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

      // Get all medications for the child with full medication details
      const { data, error } = await supabase
        .from('child_medications')
        .select('id, dosage, frequency, start_date, end_date, prescribed_by, authorization_document_url, notes, medications(id, name, generic_name, dosage_form, default_dosage, instructions)')
        .eq('child_id', id)
        .order('start_date', { ascending: false });

      if (error) {
        return errorResponse(error.message, 400);
      }

      // Transform the response to include full medication data at top level
      const medications = data?.map((item: any) => ({
        child_medication_id: item.id,
        medication_id: item.medications?.id,
        name: item.medications?.name,
        generic_name: item.medications?.generic_name,
        dosage_form: item.medications?.dosage_form,
        default_dosage: item.medications?.default_dosage,
        instructions: item.medications?.instructions,
        dosage: item.dosage,
        frequency: item.frequency,
        start_date: item.start_date,
        end_date: item.end_date,
        prescribed_by: item.prescribed_by,
        authorization_document_url: item.authorization_document_url,
        notes: item.notes,
      })) || [];

      return successResponse(medications);
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

      const validatedData = linkMedicationSchema.parse(body);

      // Insert the child medication record
      const { data, error } = await supabase
        .from('child_medications')
        .insert({
          child_id: id,
          medication_id: validatedData.medication_id,
          dosage: validatedData.dosage,
          frequency: validatedData.frequency || null,
          start_date: validatedData.start_date || null,
          end_date: validatedData.end_date || null,
          prescribed_by: validatedData.prescribed_by || null,
          notes: validatedData.notes || null,
        })
        .select('id, dosage, frequency, start_date, end_date, prescribed_by, authorization_document_url, notes, medications(id, name, generic_name, dosage_form, default_dosage, instructions)')
        .single();

      if (error) {
        // Handle duplicate medication assignment on same start date
        if (error.code === '23505') {
          return errorResponse('This medication is already linked to this child for the given start date', 409);
        }
        return errorResponse(error.message, 400);
      }

      const result = {
        child_medication_id: data.id,
        medication_id: data.medications?.id,
        name: data.medications?.name,
        generic_name: data.medications?.generic_name,
        dosage_form: data.medications?.dosage_form,
        default_dosage: data.medications?.default_dosage,
        instructions: data.medications?.instructions,
        dosage: data.dosage,
        frequency: data.frequency,
        start_date: data.start_date,
        end_date: data.end_date,
        prescribed_by: data.prescribed_by,
        authorization_document_url: data.authorization_document_url,
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
      const medicationId = url.searchParams.get('medication_id');

      if (!medicationId || !validateUUID(medicationId)) {
        return errorResponse('Invalid or missing medication_id parameter', 400);
      }

      const supabase = getUserClient(req);

      // Delete the child medication record
      const { data, error } = await supabase
        .from('child_medications')
        .delete()
        .eq('child_id', id)
        .eq('medication_id', medicationId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return errorResponse('Medication not found for this child', 404);
        }
        return errorResponse(error.message, 400);
      }

      return successResponse({ message: 'Medication removed from child', id: data.id });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return errorResponse(message, error instanceof Error && error.message.includes('Unauthorized') ? 401 : 500);
    }
  })(req);
}
