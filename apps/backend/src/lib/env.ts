import { z } from 'zod';

const envSchema = z.object({
  // Required environment variables
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),

  // Optional with defaults
  RATE_LIMIT_PER_USER: z.coerce.number().default(100),
  RATE_LIMIT_PER_IP: z.coerce.number().default(200),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Optional
  SENTRY_DSN: z.string().url().optional(),
  DATABASE_URL: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

/**
 * Validates and returns the environment configuration.
 * Caches the result to avoid re-validation on subsequent calls.
 *
 * @throws {Error} If environment validation fails
 * @returns {Env} Validated environment configuration
 */
export function getEnv(): Env {
  if (!_env) {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
      console.error('❌ Environment validation failed:');
      result.error.issues.forEach(issue => {
        console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
      });
      throw new Error('Invalid environment configuration. Check server logs.');
    }
    _env = result.data;
  }
  return _env;
}
