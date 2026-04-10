import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/rbac';
import { getUserClient, errorResponse, successResponse, validateUUID } from '@/lib/api/helpers';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return requireAuth(async (req: NextRequest, user) => {
    try {
      const { id } = params;

      if (!validateUUID(id)) {
        return errorResponse('Invalid child ID format', 400);
      }

      const supabase = getUserClient(req);

      // Get allergies
      const { data: allergiesData, error: allergyError } = await supabase
        .from('child_allergies')
        .select('allergies(name, severity_level), reaction_description')
        .eq('child_id', id);

      if (allergyError) {
        return errorResponse(allergyError.message, 400);
      }

      // Get medications
      const { data: medicationsData, error: medError } = await supabase
        .from('child_medications')
        .select('medications(name), dosage, frequency, start_date, end_date')
        .eq('child_id', id)
        .order('start_date', { ascending: false });

      if (medError) {
        return errorResponse(medError.message, 400);
      }

      // Transform allergies to compact format
      const allergies = allergiesData?.map((item: any) => ({
        name: item.allergies?.name,
        severity_level: item.allergies?.severity_level,
        reaction_description: item.reaction_description,
      })) || [];

      // Transform medications to compact format
      const medications = medicationsData?.map((item: any) => ({
        name: item.medications?.name,
        dosage: item.dosage,
        frequency: item.frequency,
        start_date: item.start_date,
        end_date: item.end_date,
      })) || [];

      const summary = {
        allergies,
        medications,
      };

      return successResponse(summary);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return errorResponse(message, error instanceof Error && error.message.includes('Unauthorized') ? 401 : 500);
    }
  })(req);
}
