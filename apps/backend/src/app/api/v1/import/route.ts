import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePermission } from '@/lib/auth/rbac';
import { getUserClient, errorResponse } from '@/lib/api/helpers';

/**
 * POST /api/v1/import
 * Handles bulk data import for children, employees, visits, and authorizations
 * Requires manage:reports permission
 */

const importPayloadSchema = z.object({
  type: z.enum(['children', 'employees', 'visits', 'authorizations']),
  data: z.array(z.record(z.unknown())).max(1000, 'Maximum 1000 records per import'),
});

/**
 * Validation schemas for each record type
 */
const childRecordSchema = z.object({
  first_name: z.string().min(1, 'First name required'),
  last_name: z.string().min(1, 'Last name required'),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  enrollment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  class_id: z.string().uuid().optional(),
  notes: z.string().optional(),
  photo_url: z.string().url().optional(),
});

const employeeRecordSchema = z.object({
  first_name: z.string().min(1, 'First name required'),
  last_name: z.string().min(1, 'Last name required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  department_id: z.string().uuid().optional(),
  role_id: z.string().uuid().optional(),
  hire_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  photo_url: z.string().url().nullable().optional(),
  notes: z.string().optional(),
});

const visitRecordSchema = z.object({
  child_id: z.string().uuid('Invalid child ID'),
  visit_type: z.enum(['check_in', 'medication', 'injury', 'illness', 'wellness']),
  reason: z.string().min(1, 'Visit reason required'),
  notes: z.string().optional(),
  started_at: z.string().datetime().optional(),
});

const authorizationRecordSchema = z.object({
  child_id: z.string().uuid('Invalid child ID'),
  title: z.string().min(1, 'Authorization title required'),
  description: z.string().optional(),
  treatment_plan: z.string().optional(),
  requested_by: z.string().optional(),
});

const SCHEMA_MAP = {
  children: childRecordSchema,
  employees: employeeRecordSchema,
  visits: visitRecordSchema,
  authorizations: authorizationRecordSchema,
};

export const POST = requirePermission('manage:reports', async (req: NextRequest, user) => {
  try {
    const body = await req.json();

    // Validate request payload
    const parseResult = importPayloadSchema.safeParse(body);
    if (!parseResult.success) {
      const errors = parseResult.error.flatten().fieldErrors;
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    const { type, data } = parseResult.data;
    const recordSchema = SCHEMA_MAP[type as keyof typeof SCHEMA_MAP];

    if (!recordSchema) {
      return errorResponse(`Unknown record type: ${type}`, 400);
    }

    const supabase = getUserClient(req);

    // Validate and process each record
    const validRecords: any[] = [];
    const errors: Array<{ index: number; errors: string[] }> = [];

    for (let i = 0; i < data.length; i++) {
      const record = data[i];
      const validationResult = recordSchema.safeParse(record);

      if (!validationResult.success) {
        const errorMessages = validationResult.error.errors.map(
          (e) => `${e.path.join('.')}: ${e.message}`
        );
        errors.push({ index: i, errors: errorMessages });
      } else {
        // For visits, set default started_at if not provided
        if (type === 'visits' && !validationResult.data.started_at) {
          validationResult.data.started_at = new Date().toISOString();
        }

        // For authorizations, set default status if not provided
        if (type === 'authorizations' && !validationResult.data.status) {
          validationResult.data.status = 'pending';
        }

        validRecords.push(validationResult.data);
      }
    }

    // If no valid records, return error
    if (validRecords.length === 0) {
      return NextResponse.json(
        {
          error: 'No valid records to import',
          errors,
          summary: {
            totalRecords: data.length,
            validRecords: 0,
            failedRecords: data.length,
          },
        },
        { status: 400 }
      );
    }

    // Insert valid records into database
    const { data: insertedData, error: insertError } = await supabase
      .from(type)
      .insert(validRecords)
      .select();

    if (insertError) {
      return errorResponse(
        `Database insert error: ${insertError.message}`,
        400
      );
    }

    const successCount = insertedData?.length || 0;

    return NextResponse.json(
      {
        success: true,
        summary: {
          totalRecords: data.length,
          validRecords: validRecords.length,
          importedRecords: successCount,
          failedRecords: data.length - successCount,
        },
        errors: errors.length > 0 ? errors : undefined,
        importedAt: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Import endpoint error:', error);
    const message = error instanceof Error ? error.message : 'Invalid request body';
    return errorResponse(message, 400);
  }
});
