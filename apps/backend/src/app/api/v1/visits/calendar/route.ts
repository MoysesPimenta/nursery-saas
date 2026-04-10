import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/rbac';
import { getUserClient, getFilterParams, errorResponse, successResponse } from '@/lib/api/helpers';

interface CalendarEvent {
  date: string;
  visits: any[];
  medications: any[];
}

export const GET = requireAuth(async (req: NextRequest, user) => {
  try {
    const supabase = getUserClient(req);
    const filters = getFilterParams(req, ['start', 'end']);

    if (!filters.start || !filters.end) {
      return errorResponse('start and end query parameters are required (format: YYYY-MM-DD)', 400);
    }

    const startDate = filters.start;
    const endDate = filters.end;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      return errorResponse('Invalid date format. Use YYYY-MM-DD', 400);
    }

    // Fetch visits within the date range
    const { data: visits, error: visitsError } = await supabase
      .from('visits')
      .select('id, child_id, visit_type, chief_complaint, started_at, children(first_name, last_name)')
      .gte('started_at', `${startDate}T00:00:00Z`)
      .lte('started_at', `${endDate}T23:59:59Z`)
      .order('started_at', { ascending: false });

    if (visitsError) {
      return errorResponse(visitsError.message, 400);
    }

    // Fetch active child_medications that overlap with the date range
    const { data: medications, error: medicationsError } = await supabase
      .from('child_medications')
      .select(
        'id, child_id, medication_id, dosage, frequency, start_date, end_date, medications(name), children(first_name, last_name)'
      )
      .lte('start_date', endDate)
      .or(`end_date.is.null,end_date.gte.${startDate}`);

    if (medicationsError) {
      return errorResponse(medicationsError.message, 400);
    }

    // Group visits by date
    const eventsByDate: Record<string, CalendarEvent> = {};

    // Add visits
    (visits || []).forEach((visit: any) => {
      const visitDate = visit.started_at.split('T')[0];
      if (!eventsByDate[visitDate]) {
        eventsByDate[visitDate] = { date: visitDate, visits: [], medications: [] };
      }
      eventsByDate[visitDate].visits.push({
        id: visit.id,
        type: visit.visit_type,
        complaint: visit.chief_complaint,
        childName: visit.children
          ? `${visit.children.first_name} ${visit.children.last_name}`
          : 'Unknown',
        timestamp: visit.started_at,
      });
    });

    // Add medications (grouped by medication date range)
    (medications || []).forEach((med: any) => {
      const startDateObj = new Date(med.start_date);
      const endDateObj = med.end_date ? new Date(med.end_date) : new Date(endDate);
      const currentDate = new Date(startDate);

      while (currentDate <= endDateObj && currentDate.toISOString().split('T')[0] <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        if (currentDate >= startDateObj) {
          if (!eventsByDate[dateStr]) {
            eventsByDate[dateStr] = { date: dateStr, visits: [], medications: [] };
          }
          eventsByDate[dateStr].medications.push({
            id: med.id,
            name: med.medications?.name || 'Unknown',
            dosage: med.dosage,
            frequency: med.frequency,
            childName: med.children
              ? `${med.children.first_name} ${med.children.last_name}`
              : 'Unknown',
          });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    // Convert to array and sort by date
    const events = Object.values(eventsByDate).sort((a, b) => a.date.localeCompare(b.date));

    return successResponse({ events }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, 500);
  }
});
