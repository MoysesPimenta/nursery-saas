import { initTRPC } from '@trpc/server';
import { Context } from './context';

/**
 * SCAFFOLDING FOR FUTURE USE
 *
 * This tRPC router is currently not used in the application.
 * Currently, the backend uses REST API endpoints for all CRUD operations.
 * The tRPC setup is ready for future migration if needed.
 *
 * To enable tRPC:
 * 1. Create /app/api/trpc/[trpc]/route.ts handler
 * 2. Export AppRouter type from this router
 * 3. Add CRUD procedures (children, employees, visits, etc.)
 */

/**
 * tRPC router initialization
 * Defines the root router and common middleware
 */

const t = initTRPC.context<Context>().create();

/**
 * Public middleware - no authentication required
 */
const publicProcedure = t.procedure;

/**
 * Protected middleware - requires valid JWT token
 */
const protectedProcedure = t.procedure.use(async (opts) => {
  if (!opts.ctx.userId) {
    throw new Error('Unauthorized - valid JWT token required');
  }
  return opts.next({
    ctx: {
      ...opts.ctx,
      userId: opts.ctx.userId,
      tenantId: opts.ctx.tenantId,
    },
  });
});

/**
 * Root tRPC router
 */
export const router = t.router({
  /**
   * Health check procedure
   */
  health: publicProcedure.query(async () => {
    return {
      status: 'healthy',
      service: 'nursery-saas-trpc',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
    };
  }),

  // TODO: Add more procedures for:
  // - children (CRUD operations)
  // - employees (CRUD operations)
  // - visits (CRUD operations)
  // - authorizations (CRUD operations)
  // - tenants (management)
});

export type AppRouter = typeof router;
