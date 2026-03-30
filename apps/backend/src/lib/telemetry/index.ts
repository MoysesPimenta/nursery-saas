import * as Sentry from '@sentry/nextjs';

/**
 * OpenTelemetry and observability setup
 * Integrates Sentry for error tracking and performance monitoring
 */

export function initTelemetry() {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      integrations: [
        new Sentry.Integrations.OnUncaughtException(),
        new Sentry.Integrations.OnUnhandledRejection(),
      ],
      // Set sample rates for performance monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      environment: process.env.NODE_ENV || 'development',
    });
  }
}

/**
 * Capture exception with Sentry
 */
export function captureException(error: unknown, context?: Record<string, any>) {
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, {
      tags: context,
    });
  }
}

/**
 * Capture message with Sentry
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (process.env.SENTRY_DSN) {
    Sentry.captureMessage(message, level);
  }
}

/**
 * Set user context for error tracking
 */
export function setUserContext(userId: string, tenantId?: string) {
  if (process.env.SENTRY_DSN) {
    Sentry.setUser({
      id: userId,
      ip_address: '{{ ip_address }}',
      ...(tenantId && { organization: tenantId }),
    });
  }
}

// TODO: Setup OpenTelemetry SDK with:
// - @opentelemetry/sdk-node
// - @opentelemetry/auto-instrumentations-node
// - @opentelemetry/exporter-trace-otlp-http
// - Trace context propagation
// - Custom span creation for business logic
