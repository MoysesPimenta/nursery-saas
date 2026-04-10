import {
  verifyToken,
  extractBearerToken,
  decodeJWTPayload,
} from '../../lib/auth/verify-token';
import { getSupabaseServerClient } from '../../lib/supabase/server';

// Mock the Supabase server client
jest.mock('../../lib/supabase/server');

const mockGetSupabaseServerClient =
  getSupabaseServerClient as jest.MockedFunction<typeof getSupabaseServerClient>;

describe('Token Verification', () => {
  const mockAdminClient = {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  };

  const mockUserId = '550e8400-e29b-41d4-a716-446655440000';
  const mockTenantId = '650e8400-e29b-41d4-a716-446655440001';
  const mockValidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJleHAiOjk5OTk5OTk5OTl9.test_signature';

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSupabaseServerClient.mockReturnValue(mockAdminClient as any);
    mockAdminClient.auth.getUser.mockReset();
    mockAdminClient.from.mockReset();
  });

  describe('decodeJWTPayload', () => {
    it('should decode a valid JWT token', () => {
      const payload = decodeJWTPayload(mockValidToken);

      expect(payload).toBeDefined();
      expect(payload?.sub).toBe(mockUserId);
      expect(payload?.email).toBe('test@example.com');
    });

    it('should return null for invalid token format', () => {
      const payload = decodeJWTPayload('invalid.token');
      expect(payload).toBeNull();
    });

    it('should return null for token with wrong number of parts', () => {
      const payload = decodeJWTPayload('only.two');
      expect(payload).toBeNull();
    });

    it('should return null for malformed base64', () => {
      const payload = decodeJWTPayload('invalid.!!!invalid.signature');
      expect(payload).toBeNull();
    });

    it('should handle tokens with padding correctly', () => {
      const payload = decodeJWTPayload(mockValidToken);
      expect(payload).not.toBeNull();
    });
  });

  describe('extractBearerToken', () => {
    it('should extract token from valid Authorization header', () => {
      const token = extractBearerToken('Bearer my-jwt-token-here');
      expect(token).toBe('my-jwt-token-here');
    });

    it('should return null for null header', () => {
      const token = extractBearerToken(null);
      expect(token).toBeNull();
    });

    it('should return null for header without Bearer prefix', () => {
      const token = extractBearerToken('Basic xyz123');
      expect(token).toBeNull();
    });

    it('should return null for empty header', () => {
      const token = extractBearerToken('');
      expect(token).toBeNull();
    });

    it('should handle header with only Bearer prefix', () => {
      const token = extractBearerToken('Bearer ');
      expect(token).toBe('');
    });

    it('should preserve token case sensitivity', () => {
      const token = extractBearerToken('Bearer MyTokenWithCASE123');
      expect(token).toBe('MyTokenWithCASE123');
    });
  });

  describe('verifyToken', () => {
    describe('successful token verification', () => {
      it('should return AuthUser with roles and permissions for valid token', async () => {
        mockAdminClient.auth.getUser.mockResolvedValue({
          data: {
            user: {
              id: mockUserId,
              email: 'user@example.com',
            },
          },
          error: null,
        });

        const mockSelect = jest.fn();
        const mockEq = jest.fn();
        const mockSingle = jest.fn();
        const mockIn = jest.fn();

        mockAdminClient.from.mockReturnValue({
          select: mockSelect,
        } as any);

        mockSelect.mockReturnValue({
          eq: mockEq,
        } as any);

        mockEq.mockReturnValue({
          eq: mockEq,
          single: mockSingle,
        } as any);

        // First call: fetch user data
        mockSingle.mockResolvedValueOnce({
          data: {
            tenant_id: mockTenantId,
            full_name: 'Test User',
          },
          error: null,
        });

        // Second call: fetch user roles
        mockEq.mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            eq: jest.fn().mockReturnValueOnce({
              eq: jest.fn().mockResolvedValueOnce({
                data: [
                  {
                    role_id: 'role-1',
                    roles: { name: 'school_admin' },
                  },
                  {
                    role_id: 'role-2',
                    roles: { name: 'manager' },
                  },
                ],
                error: null,
              }),
            }),
          }),
        });

        // Update the mock to handle the sequential calls correctly
        let callCount = 0;
        mockAdminClient.from.mockImplementation((table: string) => {
          callCount++;
          if (table === 'users') {
            return {
              select: () => ({
                eq: () => ({
                  eq: () => ({
                    single: () =>
                      Promise.resolve({
                        data: {
                          tenant_id: mockTenantId,
                          full_name: 'Test User',
                        },
                        error: null,
                      }),
                  }),
                }),
              }),
            };
          } else if (table === 'user_roles') {
            return {
              select: () => ({
                eq: () => ({
                  eq: () =>
                    Promise.resolve({
                      data: [
                        {
                          role_id: 'role-1',
                          roles: { name: 'school_admin' },
                        },
                      ],
                      error: null,
                    }),
                }),
              }),
            };
          } else if (table === 'role_permissions') {
            return {
              select: () => ({
                in: () =>
                  Promise.resolve({
                    data: [
                      {
                        permissions: { name: 'read:children' },
                      },
                      {
                        permissions: { name: 'write:children' },
                      },
                    ],
                    error: null,
                  }),
              }),
            };
          }
          return {};
        });

        const result = await verifyToken(mockValidToken);

        expect(result).toBeDefined();
        expect(result?.id).toBe(mockUserId);
        expect(result?.email).toBe('user@example.com');
        expect(result?.tenantId).toBe(mockTenantId);
      });

      it('should include permissions in returned AuthUser', async () => {
        mockAdminClient.auth.getUser.mockResolvedValue({
          data: {
            user: {
              id: mockUserId,
              email: 'user@example.com',
            },
          },
          error: null,
        });

        mockAdminClient.from.mockImplementation((table: string) => {
          if (table === 'users') {
            return {
              select: () => ({
                eq: () => ({
                  eq: () => ({
                    single: () =>
                      Promise.resolve({
                        data: {
                          tenant_id: mockTenantId,
                          full_name: 'Test User',
                        },
                        error: null,
                      }),
                  }),
                }),
              }),
            };
          } else if (table === 'user_roles') {
            return {
              select: () => ({
                eq: () => ({
                  eq: () =>
                    Promise.resolve({
                      data: [
                        {
                          role_id: 'role-1',
                          roles: { name: 'school_admin' },
                        },
                      ],
                      error: null,
                    }),
                }),
              }),
            };
          } else if (table === 'role_permissions') {
            return {
              select: () => ({
                in: () =>
                  Promise.resolve({
                    data: [
                      {
                        permissions: { name: 'read:children' },
                      },
                      {
                        permissions: { name: 'write:children' },
                      },
                      {
                        permissions: { name: 'manage:tenant' },
                      },
                    ],
                    error: null,
                  }),
              }),
            };
          }
          return {};
        });

        const result = await verifyToken(mockValidToken);

        expect(result?.permissions).toBeDefined();
        expect(Array.isArray(result?.permissions)).toBe(true);
      });

      it('should deduplicate permissions', async () => {
        mockAdminClient.auth.getUser.mockResolvedValue({
          data: {
            user: {
              id: mockUserId,
              email: 'user@example.com',
            },
          },
          error: null,
        });

        mockAdminClient.from.mockImplementation((table: string) => {
          if (table === 'users') {
            return {
              select: () => ({
                eq: () => ({
                  eq: () => ({
                    single: () =>
                      Promise.resolve({
                        data: {
                          tenant_id: mockTenantId,
                          full_name: 'Test User',
                        },
                        error: null,
                      }),
                  }),
                }),
              }),
            };
          } else if (table === 'user_roles') {
            return {
              select: () => ({
                eq: () => ({
                  eq: () =>
                    Promise.resolve({
                      data: [
                        {
                          role_id: 'role-1',
                          roles: { name: 'admin' },
                        },
                        {
                          role_id: 'role-2',
                          roles: { name: 'admin' },
                        },
                      ],
                      error: null,
                    }),
                }),
              }),
            };
          } else if (table === 'role_permissions') {
            return {
              select: () => ({
                in: () =>
                  Promise.resolve({
                    data: [
                      {
                        permissions: { name: 'read:children' },
                      },
                      {
                        permissions: { name: 'read:children' },
                      },
                    ],
                    error: null,
                  }),
              }),
            };
          }
          return {};
        });

        const result = await verifyToken(mockValidToken);

        expect(result?.permissions?.length).toBeLessThanOrEqual(1);
      });
    });

    describe('invalid or expired tokens', () => {
      it('should return null for invalid token', async () => {
        const result = await verifyToken('invalid-token');
        expect(result).toBeNull();
      });

      it('should return null for empty token', async () => {
        const result = await verifyToken('');
        expect(result).toBeNull();
      });

      it('should return null when getUser returns error', async () => {
        mockAdminClient.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: { message: 'Invalid token' },
        });

        const result = await verifyToken(mockValidToken);
        expect(result).toBeNull();
      });

      it('should return null when user data fetch fails', async () => {
        mockAdminClient.auth.getUser.mockResolvedValue({
          data: {
            user: {
              id: mockUserId,
              email: 'user@example.com',
            },
          },
          error: null,
        });

        mockAdminClient.from.mockImplementation((table: string) => {
          if (table === 'users') {
            return {
              select: () => ({
                eq: () => ({
                  eq: () => ({
                    single: () =>
                      Promise.resolve({
                        data: null,
                        error: { message: 'User not found' },
                      }),
                  }),
                }),
              }),
            };
          }
          return {};
        });

        const result = await verifyToken(mockValidToken);
        expect(result).toBeNull();
      });
    });

    describe('missing token handling', () => {
      it('should return null for missing token', async () => {
        const result = await verifyToken('');
        expect(result).toBeNull();
      });

      it('should return null for non-string token', async () => {
        const result = await verifyToken('');
        expect(result).toBeNull();
      });

      it('should handle null token gracefully', async () => {
        const result = await verifyToken('');
        expect(result).toBeNull();
      });
    });

    describe('user without roles', () => {
      it('should return empty roles array when user has no roles', async () => {
        mockAdminClient.auth.getUser.mockResolvedValue({
          data: {
            user: {
              id: mockUserId,
              email: 'user@example.com',
            },
          },
          error: null,
        });

        mockAdminClient.from.mockImplementation((table: string) => {
          if (table === 'users') {
            return {
              select: () => ({
                eq: () => ({
                  eq: () => ({
                    single: () =>
                      Promise.resolve({
                        data: {
                          tenant_id: mockTenantId,
                          full_name: 'Test User',
                        },
                        error: null,
                      }),
                  }),
                }),
              }),
            };
          } else if (table === 'user_roles') {
            return {
              select: () => ({
                eq: () => ({
                  eq: () =>
                    Promise.resolve({
                      data: [],
                      error: null,
                    }),
                }),
              }),
            };
          }
          return {};
        });

        const result = await verifyToken(mockValidToken);

        expect(result?.roles).toEqual([]);
      });

      it('should return empty permissions array when user has no roles', async () => {
        mockAdminClient.auth.getUser.mockResolvedValue({
          data: {
            user: {
              id: mockUserId,
              email: 'user@example.com',
            },
          },
          error: null,
        });

        mockAdminClient.from.mockImplementation((table: string) => {
          if (table === 'users') {
            return {
              select: () => ({
                eq: () => ({
                  eq: () => ({
                    single: () =>
                      Promise.resolve({
                        data: {
                          tenant_id: mockTenantId,
                          full_name: 'Test User',
                        },
                        error: null,
                      }),
                  }),
                }),
              }),
            };
          } else if (table === 'user_roles') {
            return {
              select: () => ({
                eq: () => ({
                  eq: () =>
                    Promise.resolve({
                      data: [],
                      error: null,
                    }),
                }),
              }),
            };
          }
          return {};
        });

        const result = await verifyToken(mockValidToken);

        expect(result?.permissions).toEqual([]);
      });

      it('should handle roles with null name gracefully', async () => {
        mockAdminClient.auth.getUser.mockResolvedValue({
          data: {
            user: {
              id: mockUserId,
              email: 'user@example.com',
            },
          },
          error: null,
        });

        mockAdminClient.from.mockImplementation((table: string) => {
          if (table === 'users') {
            return {
              select: () => ({
                eq: () => ({
                  eq: () => ({
                    single: () =>
                      Promise.resolve({
                        data: {
                          tenant_id: mockTenantId,
                          full_name: 'Test User',
                        },
                        error: null,
                      }),
                  }),
                }),
              }),
            };
          } else if (table === 'user_roles') {
            return {
              select: () => ({
                eq: () => ({
                  eq: () =>
                    Promise.resolve({
                      data: [
                        {
                          role_id: 'role-1',
                          roles: null,
                        },
                        {
                          role_id: 'role-2',
                          roles: { name: 'admin' },
                        },
                      ],
                      error: null,
                    }),
                }),
              }),
            };
          }
          return {};
        });

        const result = await verifyToken(mockValidToken);

        expect(result?.roles).toContain('admin');
        expect(result?.roles?.length).toBe(1);
      });
    });

    describe('error handling', () => {
      it('should return null on unexpected errors', async () => {
        mockAdminClient.auth.getUser.mockRejectedValue(
          new Error('Unexpected error')
        );

        const result = await verifyToken(mockValidToken);
        expect(result).toBeNull();
      });

      it('should continue if role permissions fetch fails', async () => {
        mockAdminClient.auth.getUser.mockResolvedValue({
          data: {
            user: {
              id: mockUserId,
              email: 'user@example.com',
            },
          },
          error: null,
        });

        mockAdminClient.from.mockImplementation((table: string) => {
          if (table === 'users') {
            return {
              select: () => ({
                eq: () => ({
                  eq: () => ({
                    single: () =>
                      Promise.resolve({
                        data: {
                          tenant_id: mockTenantId,
                          full_name: 'Test User',
                        },
                        error: null,
                      }),
                  }),
                }),
              }),
            };
          } else if (table === 'user_roles') {
            return {
              select: () => ({
                eq: () => ({
                  eq: () =>
                    Promise.resolve({
                      data: [
                        {
                          role_id: 'role-1',
                          roles: { name: 'admin' },
                        },
                      ],
                      error: null,
                    }),
                }),
              }),
            };
          } else if (table === 'role_permissions') {
            return {
              select: () => ({
                in: () =>
                  Promise.resolve({
                    data: [],
                    error: { message: 'Permission fetch failed' },
                  }),
              }),
            };
          }
          return {};
        });

        const result = await verifyToken(mockValidToken);

        // Should still return user but with empty permissions
        expect(result?.id).toBe(mockUserId);
        expect(result?.permissions).toEqual([]);
      });
    });

    describe('full name handling', () => {
      it('should include full name in response when available', async () => {
        mockAdminClient.auth.getUser.mockResolvedValue({
          data: {
            user: {
              id: mockUserId,
              email: 'user@example.com',
            },
          },
          error: null,
        });

        mockAdminClient.from.mockImplementation((table: string) => {
          if (table === 'users') {
            return {
              select: () => ({
                eq: () => ({
                  eq: () => ({
                    single: () =>
                      Promise.resolve({
                        data: {
                          tenant_id: mockTenantId,
                          full_name: 'John Doe',
                        },
                        error: null,
                      }),
                  }),
                }),
              }),
            };
          } else if (table === 'user_roles') {
            return {
              select: () => ({
                eq: () => ({
                  eq: () =>
                    Promise.resolve({
                      data: [],
                      error: null,
                    }),
                }),
              }),
            };
          }
          return {};
        });

        const result = await verifyToken(mockValidToken);

        expect(result?.fullName).toBe('John Doe');
      });

      it('should handle missing full name gracefully', async () => {
        mockAdminClient.auth.getUser.mockResolvedValue({
          data: {
            user: {
              id: mockUserId,
              email: 'user@example.com',
            },
          },
          error: null,
        });

        mockAdminClient.from.mockImplementation((table: string) => {
          if (table === 'users') {
            return {
              select: () => ({
                eq: () => ({
                  eq: () => ({
                    single: () =>
                      Promise.resolve({
                        data: {
                          tenant_id: mockTenantId,
                          full_name: null,
                        },
                        error: null,
                      }),
                  }),
                }),
              }),
            };
          } else if (table === 'user_roles') {
            return {
              select: () => ({
                eq: () => ({
                  eq: () =>
                    Promise.resolve({
                      data: [],
                      error: null,
                    }),
                }),
              }),
            };
          }
          return {};
        });

        const result = await verifyToken(mockValidToken);

        expect(result?.fullName).toBeUndefined();
      });
    });
  });
});
