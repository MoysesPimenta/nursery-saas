/**
 * API error handling utilities
 * Provides a consistent error format across the application
 */

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Handle API errors and return a properly formatted response
 */
export function handleApiError(error: unknown): Response {
  if (error instanceof ApiError) {
    return Response.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
        timestamp: new Date().toISOString(),
      },
      { status: error.statusCode }
    );
  }

  console.error('Unhandled error:', error);
  return Response.json(
    {
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
    },
    { status: 500 }
  );
}

/**
 * Commonly used API errors
 */
export const NotFoundError = (resource: string) =>
  new ApiError(404, `${resource} not found`, 'NOT_FOUND');

export const ForbiddenError = (message = 'Insufficient permissions') =>
  new ApiError(403, message, 'FORBIDDEN');

export const BadRequestError = (
  message: string,
  details?: Record<string, unknown>
) => new ApiError(400, message, 'BAD_REQUEST', details);

export const UnauthorizedError = (message = 'Authentication required') =>
  new ApiError(401, message, 'UNAUTHORIZED');
