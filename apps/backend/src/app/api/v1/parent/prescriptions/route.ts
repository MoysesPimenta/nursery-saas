import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/rbac';
import { getUserClient, errorResponse, successResponse } from '@/lib/api/helpers';

const updateConsentSchema = z.object({
  child_medication_id: z.string().uuid('Invalid medication ID'),
  consent_status: z.enum(['approved', 'rejected']),
});

export const GET = requireAuth(async (req: NextRequest, user) => {
  try {
    const supabase = getUserClient(req);

    // Get all children linked to this parent
    const { data: parentChildren, error: childError } = await supabase
      .from('child_parents')
      .select('child_id')
      .eq('parent_user_id', user.id);

    if (childError) {
      return errorResponse(childError.message, 400);
    }

    if (!parentChildren || parentChildren.length === 0) {
      return successResponse({ data: [] });
    }

    const childIds = parentChildren.map((cp: any) => cp.child_id);

    // Get all medications for these children with consent status
    const { data: medications, error: medError } = await supabase
      .from('child_medications')
      .select(
        `id, child_id, dosage, frequency, start_date, end_date, prescribed_by, notes,
         consent_status, consent_date, consented_by,
         children(first_name, last_name),
         medications(id, name, generic_name, dosage_form, default_dosage, instructions)`
      )
      .in('child_id', childIds)
      .order('consent_status', { ascending: true })
      .order('created_at', { ascending: false });

    if (medError) {
      return errorResponse(medError.message, 400);
    }

    // Transform response
    const transformed = (medications || []).map((med: any) => ({
      child_medication_id: med.id,
      child_id: med.child_id,
      child_name: med.children ? `${med.children.first_name} ${med.children.last_name}` : 'Unknown',
      medication_id: med.medications?.id,
      medication_name: med.medications?.name,
      generic_name: med.medications?.generic_name,
      dosage_form: med.medications?.dosage_form,
      default_dosage: med.medications?.default_dosage,
      instructions: med.medications?.instructions,
      dosage: med.dosage,
      frequency: med.frequency,
      start_date: med.start_date,
      end_date: med.end_date,
      prescribed_by: med.prescribed_by,
      notes: med.notes,
      consent_status: med.consent_status,
      consent_date: med.consent_date,
      consented_by: med.consented_by,
    }));

    return successResponse({ data: transformed });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, 500);
  }
});

export const PATCH = requireAuth(async (req: NextRequest, user) => {
  try {
    const supabase = getUserClient(req);
    const body = await req.json();
    const validatedData = updateConsentSchema.parse(body);

    // Verify that the medication belongs to one of the parent's children
    const { data: childMed, error: checkError } = await supabase
      .from('child_medications')
      .select('child_id')
      .eq('id', validatedData.child_medication_id)
      .single();

    if (checkError || !childMed) {
      return errorResponse('Medication not found', 404);
    }

    // Verify parent has access to this child
    const { data: childAccess, error: accessError } = await supabase
      .from('child_parents')
      .select('id')
      .eq('child_id', childMed.child_id)
      .eq('parent_user_id', user.id)
      .single();

    if (accessError || !childAccess) {
      return errorResponse('You do not have access to this child', 403);
    }

    // Update consent status
    const { data: updated, error: updateError } = await supabase
      .from('child_medications')
      .update({
        consent_status: validatedData.consent_status,
        consent_date: new Date().toISOString(),
        consented_by: user.id,
      })
      .eq('id', validatedData.child_medication_id)
      .select(
        `id, child_id, dosage, frequency, start_date, end_date, prescribed_by, notes,
         consent_status, consent_date, consented_by,
         children(first_name, last_name),
         medications(id, name, generic_name, dosage_form, default_dosage, instructions)`
      )
      .single();

    if (updateError) {
      return errorResponse(updateError.message, 400);
    }

    const result = {
      child_medication_id: updated.id,
      child_id: updated.child_id,
      child_name: updated.children ? `${updated.children.first_name} ${updated.children.last_name}` : 'Unknown',
      medication_id: updated.medications?.id,
      medication_name: updated.medications?.name,
      generic_name: updated.medications?.generic_name,
      dosage_form: updated.medications?.dosage_form,
      default_dosage: updated.medications?.default_dosage,
      instructions: updated.medications?.instructions,
      dosage: updated.dosage,
      frequency: updated.frequency,
      start_date: updated.start_date,
      end_date: updated.end_date,
      prescribed_by: updated.prescribed_by,
      notes: updated.notes,
      consent_status: updated.consent_status,
      consent_date: updated.consent_date,
      consented_by: updated.consented_by,
    };

    return successResponse(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(
        `Validation error: ${error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        400
      );
    }
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, 500);
  }
});
