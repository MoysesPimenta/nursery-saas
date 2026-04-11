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
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
  prescription_document_url: z.string().url('Invalid URL format').optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return requireAuth(async (req: NextRequest, user) => {
    try {
      const { id } = params;
      if (!validateUUID(id)) return errorResponse('Invalid employee ID format', 400);

      const supabase = getUserClient(req);
      const { data, error } = await supabase
        .from('employee_medications')
        .select('id, dosage, frequency, start_date, end_date, prescribed_by, notes, due_date, prescription_document_url, medications(id, name, generic_name, dosage_form, default_dosage, instructions)')
        .eq('employee_id', id)
        .order('start_date', { ascending: false });

      if (error) return errorResponse(error.message, 400);

      const medications = data?.map((item: any) => ({
        child_medication_id: item.id,
        medication_id: item.medications?.id,
        name: item.medications?.name,
        generic_name: item.medications?.generic_name,
        dosage_form: item.medications?.dosage_form,
        dosage: item.dosage,
        frequency: item.frequency,
        start_date: item.start_date,
        end_date: item.end_date,
        prescribed_by: item.prescribed_by,
        notes: item.notes,
        due_date: item.due_date,
        prescription_document_url: item.prescription_document_url,
      })) || [];

      return successResponse(medications);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return errorResponse(message, 500);
    }
  })(req);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return requirePermission('manage_employees', async (req: NextRequest, user) => {
    try {
      const { id } = params;
      if (!validateUUID(id)) return errorResponse('Invalid employee ID format', 400);

      const supabase = getUserClient(req);
      const body = await req.json();
      const validatedData = linkMedicationSchema.parse(body);

      const { data, error } = await supabase
        .from('employee_medications')
        .insert({
          employee_id: id,
          medication_id: validatedData.medication_id,
          dosage: validatedData.dosage,
          frequency: validatedData.frequency || null,
          start_date: validatedData.start_date || null,
          end_date: validatedData.end_date || null,
          prescribed_by: validatedData.prescribed_by || null,
          notes: validatedData.notes || null,
          due_date: validatedData.due_date || null,
          prescription_document_url: validatedData.prescription_document_url || null,
        })
        .select('id, dosage, frequency, start_date, end_date, prescribed_by, notes, due_date, prescription_document_url, medications(id, name, generic_name, dosage_form)')
        .single();

      if (error) {
        if (error.code === '23505') return errorResponse('This medication is already linked to this employee for the given start date', 409);
        return errorResponse(error.message, 400);
      }

      return successResponse({
        child_medication_id: data.id,
        medication_id: data.medications?.id,
        name: data.medications?.name,
        dosage: data.dosage,
        frequency: data.frequency,
        start_date: data.start_date,
        end_date: data.end_date,
        prescribed_by: data.prescribed_by,
        notes: data.notes,
        due_date: data.due_date,
        prescription_document_url: data.prescription_document_url,
      }, 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return errorResponse(`Validation error: ${error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`, 400);
      }
      const message = error instanceof Error ? error.message : 'Internal server error';
      return errorResponse(message, 500);
    }
  })(req);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return requirePermission('manage_employees', async (req: NextRequest, user) => {
    try {
      const { id } = params;
      if (!validateUUID(id)) return errorResponse('Invalid employee ID format', 400);

      const url = new URL(req.url);
      const medicationId = url.searchParams.get('medication_id');
      if (!medicationId || !validateUUID(medicationId)) return errorResponse('Invalid or missing medication_id parameter', 400);

      const supabase = getUserClient(req);
      const { data, error } = await supabase
        .from('employee_medications')
        .delete()
        .eq('employee_id', id)
        .eq('medication_id', medicationId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') return errorResponse('Medication not found for this employee', 404);
        return errorResponse(error.message, 400);
      }

      return successResponse({ message: 'Medication removed from employee', id: data.id });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return errorResponse(message, 500);
    }
  })(req);
}
