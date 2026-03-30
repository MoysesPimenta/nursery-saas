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
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  dateOfBirth: z.coerce.date(),
  enrollmentDate: z.coerce.date().optional(),
  allergies: z.array(z.string()).optional(),
  medicalNotes: z.string().optional(),
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
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
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
  notes: z.string().optional(),
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
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  logo: z.string().url().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
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
