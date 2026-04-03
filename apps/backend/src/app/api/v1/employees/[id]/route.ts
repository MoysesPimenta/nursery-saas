import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, requirePermission } from '@/lib/auth/rbac';
import { getUserClient, errorResponse, successResponse, validateUUID } from '@/lib/api/helpers';

const updateEmployeeSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  department_id: z.string().uuid().nullable().optional(),
  role_id: z.string().uuid().nullable().optional(),
  hire_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  photo_url: z.string().url().nullable().optional(),
  notes: z.string().optional(),
  archived: z.boolean().optional(),
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

    // Get allergies
    const { data: allergies, error: allergyError } = await supabase
      .from('employee_allergies')
      .select('allergies(*)')
      .eq('employee_id', id);

    if (allergyError) {
      return errorResponse(allergyError.message, 400);
    }

    // Get medications
    const { data: medications, error: medError } = await supabase
      .from('employee_medications')
      .select('medications(*)')
      .eq('employee_id', id);

    if (medError) {
      return errorResponse(medError.message, 400);
    }

    const employeeWithDetails = {
      ...employee,
      allergies: allergies?.map((a) => a.allergies) || [],
      medications: medications?.map((m) => m.medications) || [],
    };

    return successResponse(employeeWithDetails);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, error instanceof Error && error.message.includes('Unauthorized') ? 401 : 500);
  }
  })(req);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return requirePermission('manage:employees', async (req: NextRequest, user) => {
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
  return requirePermission('manage:employees', async (req: NextRequest, user) => {
  try {
    const { id } = params;

    if (!validateUUID(id)) {
      return errorResponse('Invalid employee ID format', 400);
    }

    const supabase = getUserClient(req);

    // Soft delete by setting archived = true
    const { data, error } = await supabase
      .from('employees')
      .update({ archived: true })
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
