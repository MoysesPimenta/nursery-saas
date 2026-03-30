/**
 * Format a date string to a readable format
 */
export function formatDate(
  date: string | Date,
  locale: string = 'en-US'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format a date and time string
 */
export function formatDateTime(
  date: string | Date,
  locale: string = 'en-US'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Convert a string to a URL-friendly slug
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate a tenant subdomain from a tenant name
 */
export function generateTenantSubdomain(tenantName: string): string {
  const slug = slugify(tenantName);
  const timestamp = Date.now().toString(36).slice(-6);
  return `${slug}-${timestamp}`;
}

/**
 * Mask an email address for privacy (show only first char and domain)
 */
export function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return email;

  const maskedLocal =
    localPart.charAt(0) + '*'.repeat(localPart.length - 2) + localPart.charAt(localPart.length - 1);
  return `${maskedLocal}@${domain}`;
}

/**
 * Mask a phone number for privacy (show only last 4 digits)
 */
export function maskPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return phone;

  const lastFour = cleaned.slice(-4);
  const masked = '*'.repeat(cleaned.length - 4) + lastFour;
  return masked;
}

/**
 * Mask PII (personally identifiable information) generically
 */
export function maskPII(value: string, type: 'email' | 'phone' | 'auto' = 'auto'): string {
  if (type === 'email' || (type === 'auto' && value.includes('@'))) {
    return maskEmail(value);
  }
  if (type === 'phone' || (type === 'auto' && /^\+?[\d\s\-()]+$/.test(value))) {
    return maskPhone(value);
  }
  return value;
}

/**
 * Generate a random ID (simple implementation, use proper UUID library in production)
 */
export function generateId(prefix: string = ''): string {
  const randomPart = Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
  return prefix ? `${prefix}_${randomPart}` : randomPart;
}

/**
 * Check if a value is a valid email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if a value is a valid phone number (basic check)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[+]?[\d\s\-()]{10,}$/;
  return phoneRegex.test(phone);
}

/**
 * Get the age from a date of birth
 */
export function getAge(dateOfBirth: string | Date): number {
  const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age;
}

/**
 * Format a blood type with proper notation
 */
export function formatBloodType(bloodType: string): string {
  return bloodType.toUpperCase().replace(/([ABO]+)([+-])/, '$1 $2');
}

/**
 * Capitalize the first letter of a string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Convert enum-like strings to readable labels
 */
export function enumToLabel(value: string): string {
  return value
    .split('_')
    .map(capitalize)
    .join(' ');
}
