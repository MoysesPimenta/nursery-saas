import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/rbac';
import { getUserClient, errorResponse } from '@/lib/api/helpers';

/**
 * GET /api/v1/export
 * Handles bulk data export for children, employees, and visit records
 * Query parameters:
 *   - type: 'children' | 'employees' | 'visits' | 'authorizations'
 *   - format: 'json' | 'csv'
 *
 * Requires view_reports permission
 */

const VALID_TYPES = ['children', 'employees', 'visits', 'authorizations'] as const;
const VALID_FORMATS = ['json', 'csv'] as const;

/**
 * Convert array of objects to CSV string with headers
 */
function convertToCSV(records: Record<string, any>[]): string {
  if (records.length === 0) {
    return '';
  }

  // Get all unique keys across all records
  const keys = Array.from(
    new Set(records.flatMap((record) => Object.keys(record)))
  );

  // Create header row
  const header = keys.join(',');

  // Create data rows, escaping values as needed
  const rows = records.map((record) =>
    keys
      .map((key) => {
        const value = record[key];
        if (value === null || value === undefined) {
          return '';
        }

        const stringValue = String(value);
        // Escape quotes and wrap in quotes if contains comma, newline, or quote
        if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }

        return stringValue;
      })
      .join(',')
  );

  return [header, ...rows].join('\n');
}

export const GET = requirePermission('view_reports', async (req: NextRequest, user) => {
  try {
    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get('type');
    const format = searchParams.get('format') || 'json';

    // Validate query parameters
    if (!type || !VALID_TYPES.includes(type as any)) {
      return errorResponse(
        `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`,
        400
      );
    }

    if (!VALID_FORMATS.includes(format as any)) {
      return errorResponse(
        `Invalid format. Must be one of: ${VALID_FORMATS.join(', ')}`,
        400
      );
    }

    const supabase = getUserClient(req);

    // Fetch all records of the given type
    const { data, error } = await supabase
      .from(type)
      .select('*');

    if (error) {
      return errorResponse(error.message, 400);
    }

    const records = data || [];

    if (format === 'csv') {
      const csvContent = convertToCSV(records);
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${type}_export.csv"`,
        },
      });
    }

    // JSON format
    return NextResponse.json(
      {
        data: records,
        meta: {
          type,
          count: records.length,
          exportedAt: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(
      message,
      error instanceof Error && error.message.includes('Unauthorized') ? 401 : 500
    );
  }
});
