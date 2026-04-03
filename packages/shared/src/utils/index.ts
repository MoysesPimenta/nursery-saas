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

/**
 * Format a full name from first and last name
 */
export function formatFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

/**
 * Get initials from first and last name
 */
export function getInitials(firstName: string, lastName: string): string {
  const first = firstName.charAt(0).toUpperCase();
  const last = lastName.charAt(0).toUpperCase();
  return `${first}${last}`;
}

/**
 * Format a phone number with basic formatting
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    // US/Canada format with country code
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  if (cleaned.length === 10) {
    // US/Canada format without country code
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  // Return original for non-standard lengths
  return phone;
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Build a query string from parameters object
 */
export function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, ms: number): T {
  let timeoutId: NodeJS.Timeout | null = null;

  const debounced = (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, ms);
  };

  return debounced as T;
}
