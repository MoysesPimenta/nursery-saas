import { z } from 'zod';

/**
 * Zod validation schemas for core entities
 * Used across API routes and tRPC procedures
 */

// UUID validation
const uuidSchema = z.string().uuid();

// Base timestamp fields
const timestampFields = {
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
};

/**
 * Child entity schema
 */
export const childSchema = z.object({
  id: uuidSchema.optional(),
  tenantId: uuidSchema,
  firstName: z.string().min(1, 'First name is required').max(100, 'First name must be at most 100 characters'),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name must be at most 100 characters'),
  dateOfBirth: z.coerce.date().refine((date) => date <= new Date(), {
    message: 'Date of birth cannot be in the future',
  }),
  enrollmentDate: z.coerce.date().optional(),
  allergies: z.array(z.string()).optional(),
  medicalNotes: z.string().max(5000, 'Medical notes must be at most 5000 characters').optional(),
  photo: z.string().url().optional(),
  ...timestampFields,
});

export type Child = z.infer<typeof childSchema>;

/**
 * Employee entity schema
 */
export const employeeSchema = z.object({
  id: uuidSchema.optional(),
  tenantId: uuidSchema,
  userId: uuidSchema,
  firstName: z.string().min(1, 'First name is required').max(100, 'First name must be at most 100 characters'),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name must be at most 100 characters'),
  email: z.string().email('Invalid email address'),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Phone number must be a valid E.164 format')
    .optional(),
  role: z.enum(['admin', 'manager', 'employee']),
  hireDate: z.coerce.date(),
  certifications: z.array(z.string()).optional(),
  avatar: z.string().url().optional(),
  ...timestampFields,
});

export type Employee = z.infer<typeof employeeSchema>;

/**
 * Visit entity schema (attendance/check-in/check-out)
 */
export const visitSchema = z.object({
  id: uuidSchema.optional(),
  tenantId: uuidSchema,
  childId: uuidSchema,
  checkInTime: z.coerce.date(),
  checkOutTime: z.coerce.date().optional(),
  checkedInBy: uuidSchema,
  checkedOutBy: uuidSchema.optional(),
  notes: z.string().max(5000, 'Notes must be at most 5000 characters').optional(),
  ...timestampFields,
});

export type Visit = z.infer<typeof visitSchema>;

/**
 * Authorization entity schema (parent/guardian pick-up authorization)
 */
export const authorizationSchema = z.object({
  id: uuidSchema.optional(),
  tenantId: uuidSchema,
  childId: uuidSchema,
  authorizedPersonId: uuidSchema, // Parent/Guardian ID
  relationship: z.enum(['parent', 'guardian', 'relative', 'emergency_contact']),
  pickupPermission: z.boolean().default(true),
  emergencyContact: z.boolean().default(false),
  isActive: z.boolean().default(true),
  expiresAt: z.coerce.date().optional(),
  ...timestampFields,
});

export type Authorization = z.infer<typeof authorizationSchema>;

/**
 * Tenant entity schema
 */
export const tenantSchema = z.object({
  id: uuidSchema.optional(),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be at most 255 characters'),
  slug: z.string().min(1, 'Slug is required').max(100, 'Slug must be at most 100 characters').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  logo: z.string().url('Logo must be a valid URL').optional(),
  address: z.string().max(255, 'Address must be at most 255 characters').optional(),
  city: z.string().max(100, 'City must be at most 100 characters').optional(),
  state: z.string().max(100, 'State must be at most 100 characters').optional(),
  zipCode: z.string().max(20, 'Zip code must be at most 20 characters').optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Phone number must be a valid E.164 format')
    .optional(),
  email: z.string().email('Invalid email address').optional(),
  isActive: z.boolean().default(true),
  ...timestampFields,
});

export type Tenant = z.infer<typeof tenantSchema>;

/**
 * Batch import payload schemas
 */
export const importChildrenPayloadSchema = z.object({
  tenantId: uuidSchema,
  data: z.array(childSchema.omit({ id: true, tenantId: true })),
});

export const importEmployeesPayloadSchema = z.object({
  tenantId: uuidSchema,
  data: z.array(employeeSchema.omit({ id: true, tenantId: true })),
});

export const importVisitsPayloadSchema = z.object({
  tenantId: uuidSchema,
  data: z.array(visitSchema.omit({ id: true, tenantId: true })),
});

export const importAuthorizationsPayloadSchema = z.object({
  tenantId: uuidSchema,
  data: z.array(authorizationSchema.omit({ id: true, tenantId: true })),
});
