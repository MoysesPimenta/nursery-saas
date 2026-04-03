export const SYSTEM_ROLES = [
  'super_admin',
  'school_admin',
  'nurse',
  'teacher',
  'inspector',
  'parent',
  'read_only',
] as const;

export const SUBSCRIPTION_TIERS = [
  'free',
  'starter',
  'professional',
  'enterprise',
] as const;

export const VISIT_TYPES = [
  'authorization',
  'walk_in',
  'scheduled',
  'emergency',
] as const;

export const DISPOSITIONS = [
  'returned_to_class',
  'sent_home',
  'referred',
  'hospitalized',
  'other',
] as const;

export const ALLERGY_SEVERITIES = [
  'mild',
  'moderate',
  'severe',
  'life_threatening',
] as const;

export const DOSAGE_FORMS = [
  'tablet',
  'liquid',
  'injection',
  'topical',
  'inhaler',
  'other',
] as const;

export const AUTHORIZATION_STATUSES = [
  'pending',
  'accepted',
  'rejected',
  'cancelled',
] as const;

export const SUPPORTED_LOCALES = [
  'en',
  'pt-BR',
  'es',
  'de',
  'fr',
  'it',
  'he',
] as const;

export const DEFAULT_LOCALE = 'en';

export const RTL_LOCALES = ['he'] as const;

export const MAX_PENDING_AUTHORIZATIONS_PER_TEACHER = 5;

export const RATE_LIMITS = {
  perUser: 15,
  perTenant: 50,
  parentApi: 100,
  loginAttempts: 10,
  loginWindowMinutes: 5,
} as const;

export const CACHE_TTL = {
  medicationCatalog: 300, // 5 minutes
  allergyList: 300,
  tenantSettings: 600, // 10 minutes
} as const;

export const WEBHOOK_EVENTS = [
  'child.created',
  'child.updated',
  'child.archived',
  'visit.logged',
  'visit.updated',
  'authorization.created',
  'authorization.accepted',
  'authorization.rejected',
  'medication.dispensed',
  'employee.created',
  'employee.updated',
] as const;
