import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, requirePermission } from '@/lib/auth/rbac';
import { getUserClient, errorResponse, successResponse, validateUUID } from '@/lib/api/helpers';

const updateEmployeeSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  user_id: z.string().uuid().nullable().optional(),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  department_id: z.string().uuid().nullable().optional(),
  position: z.string().optional(),
  hire_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  photo_url: z.string().url().nullable().optional(),
  blood_type: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  notes: z.string().optional(),
  is_archived: z.boolean().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return requireAuth(async (req: NextRequest, user) => {
  try {
    const { id } = params;

    if (!validateUUID(id)) {
      return errorResponse('Invalid employee ID format', 400);
    }

    const supabase = getUserClient(req);

    // Get employee
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();

    if (employeeError) {
      return errorResponse(employeeError.message, employeeError.code === 'PGRST116' ? 404 : 400);
    }

    // Get allergies with full details
    const { data: allergies, error: allergyError } = await supabase
      .from('employee_allergies')
      .select('id, reaction_description, diagnosed_date, notes, allergies(*)')
      .eq('employee_id', id);

    if (allergyError) {
      return errorResponse(allergyError.message, 400);
    }

    // Get medications with full details
    const { data: medications, error: medError } = await supabase
      .from('employee_medications')
      .select('id, dosage, frequency, start_date, end_date, prescribed_by, notes, due_date, prescription_document_url, medications(*)')
      .eq('employee_id', id)
      .order('start_date', { ascending: false });

    if (medError) {
      return errorResponse(medError.message, 400);
    }

    const employeeWithDetails = {
      ...employee,
      allergies: allergies?.map((a) => ({
        id: (a.allergies as any)?.id,
        name: (a.allergies as any)?.name,
        severity_level: (a.allergies as any)?.severity_level,
        description: (a.allergies as any)?.description,
        reaction_description: a.reaction_description,
      })) || [],
      medications: medications?.map((m) => ({
        id: (m.medications as any)?.id,
        name: (m.medications as any)?.name,
        dosage_form: (m.medications as any)?.dosage_form,
        dosage: m.dosage,
        frequency: m.frequency,
        start_date: m.start_date,
        end_date: m.end_date,
        prescribed_by: m.prescribed_by,
        notes: m.notes,
        due_date: m.due_date,
      })) || [],
    };

    return successResponse(employeeWithDetails);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, error instanceof Error && error.message.includes('Unauthorized') ? 401 : 500);
  }
  })(req);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return requirePermission('manage_employees', async (req: NextRequest, user) => {
  try {
    const { id } = params;

    if (!validateUUID(id)) {
      return errorResponse('Invalid employee ID format', 400);
    }

    const supabase = getUserClient(req);
    const body = await req.json();

    const validatedData = updateEmployeeSchema.parse(body);

    const { data, error } = await supabase
      .from('employees')
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
  return requirePermission('manage_employees', async (req: NextRequest, user) => {
  try {
    const { id } = params;

    if (!validateUUID(id)) {
      return errorResponse('Invalid employee ID format', 400);
    }

    const supabase = getUserClient(req);

    // Soft delete by setting archived = true
    const { data, error } = await supabase
      .from('employees')
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
