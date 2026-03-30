// Tenant
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  subdomain?: string;
  logoUrl?: string;
  themeColor: string;
  faviconUrl?: string;
  subscriptionTier: 'free' | 'starter' | 'professional' | 'enterprise';
  maxChildren: number;
  maxEmployees: number;
  maxStorageMb: number;
  isActive: boolean;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// User
export interface User {
  id: string;
  tenantId: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  mfaEnabled: boolean;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Role enum
export type SystemRole =
  | 'super_admin'
  | 'school_admin'
  | 'nurse'
  | 'teacher'
  | 'inspector'
  | 'parent'
  | 'read_only';

// Child
export interface Child {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender?: string;
  classId?: string;
  photoUrl?: string;
  bloodType?: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  notes?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

// Employee
export interface Employee {
  id: string;
  tenantId: string;
  userId?: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  departmentId?: string;
  position?: string;
  hireDate?: string;
  photoUrl?: string;
  bloodType?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notes?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

// Medication
export interface Medication {
  id: string;
  tenantId: string;
  name: string;
  genericName?: string;
  dosageForm: 'tablet' | 'liquid' | 'injection' | 'topical' | 'inhaler';
  defaultDosage?: string;
  instructions?: string;
  requiresAuthorization: boolean;
  isActive: boolean;
  createdAt: string;
}

// Allergy
export interface Allergy {
  id: string;
  tenantId: string;
  name: string;
  severityLevel: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  description?: string;
  createdAt: string;
}

// Authorization
export type AuthorizationStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'cancelled';
export type AuthorizationPriority = 'normal' | 'urgent';

export interface Authorization {
  id: string;
  tenantId: string;
  childId: string;
  requestedBy: string;
  assignedTo?: string;
  status: AuthorizationStatus;
  symptoms?: string;
  notes?: string;
  priority: AuthorizationPriority;
  requestedAt: string;
  respondedAt?: string;
  respondedBy?: string;
  createdAt: string;
}

// Visit
export type VisitType = 'authorization' | 'walk_in' | 'scheduled' | 'emergency';
export type Disposition =
  | 'returned_to_class'
  | 'sent_home'
  | 'referred'
  | 'hospitalized';

export interface Vitals {
  temperature?: number;
  bloodPressure?: string;
  heartRate?: number;
  weight?: number;
}

export interface MedicationAdministered {
  medicationId: string;
  dosage: string;
  time: string;
  notes?: string;
}

export interface Visit {
  id: string;
  tenantId: string;
  childId?: string;
  employeeId?: string;
  authorizationId?: string;
  nurseId: string;
  visitType: VisitType;
  chiefComplaint?: string;
  vitals?: Vitals;
  assessment?: string;
  treatment?: string;
  medicationsAdministered?: MedicationAdministered[];
  attachments?: string[];
  disposition?: Disposition;
  parentNotified: boolean;
  parentNotifiedAt?: string;
  startedAt: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Audit Log
export interface AuditLog {
  id: number;
  tenantId: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  beforeData?: Record<string, unknown>;
  afterData?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// Custom Fields
export type CustomFieldType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'date'
  | 'select'
  | 'multiselect';
export type CustomFieldEntity = 'child' | 'employee' | 'visit';

export interface CustomField {
  id: string;
  tenantId: string;
  entityType: CustomFieldEntity;
  fieldName: string;
  fieldType: CustomFieldType;
  fieldOptions?: Record<string, unknown>;
  isRequired: boolean;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}
