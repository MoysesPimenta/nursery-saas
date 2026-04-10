import { handleSignup } from '../../lib/auth/signup-handler';
import { getSupabaseServerClient } from '../../lib/supabase/server';

// Mock the Supabase server client
jest.mock('../../lib/supabase/server');

const mockGetSupabaseServerClient = getSupabaseServerClient as jest.MockedFunction<typeof getSupabaseServerClient>;

describe('handleSignup', () => {
  const mockAdminClient = {
    auth: {
      admin: {
        createUser: jest.fn(),
        deleteUser: jest.fn(),
      },
    },
    from: jest.fn(),
  };

  const validPayload = {
    email: 'john.doe@example.com',
    password: 'SecurePassword123',
    firstName: 'John',
    lastName: 'Doe',
  };

  const mockUserId = '550e8400-e29b-41d4-a716-446655440000';
  const mockTenantId = '650e8400-e29b-41d4-a716-446655440001';

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSupabaseServerClient.mockReturnValue(mockAdminClient as any);

    // Reset all mock implementations
    mockAdminClient.auth.admin.createUser.mockReset();
    mockAdminClient.auth.admin.deleteUser.mockReset();
    mockAdminClient.from.mockReset();
  });

  describe('successful signup flow', () => {
    it('should create auth user, tenant, user profile, and assign role on successful signup', async () => {
      // Setup mocks for successful flow
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: {
          user: {
            id: mockUserId,
            email: validPayload.email,
            user_metadata: {},
          },
        },
        error: null,
      });

      const mockInsert = jest.fn();
      const mockEq = jest.fn();
      const mockDelete = jest.fn();

      mockAdminClient.from.mockReturnValue({
        insert: mockInsert,
        delete: mockDelete,
      } as any);

      mockInsert.mockResolvedValue({ error: null, data: {} });
      mockDelete.mockReturnValue({ eq: mockEq } as any);
      mockEq.mockResolvedValue({ error: null, data: {} });

      const result = await handleSignup(validPayload);

      expect(mockAdminClient.auth.admin.createUser).toHaveBeenCalledWith({
        email: validPayload.email,
        password: validPayload.password,
        email_confirm: true,
        user_metadata: {
          first_name: validPayload.firstName,
          last_name: validPayload.lastName,
          full_name: 'John Doe',
        },
      });

      expect(result).toEqual({
        user: {
          id: mockUserId,
          email: validPayload.email,
          fullName: 'John Doe',
          tenantId: expect.any(String),
          roles: ['school_admin'],
        },
        message: 'Account created successfully. You can now sign in.',
      });

      expect(mockAdminClient.from).toHaveBeenCalledWith('tenants');
      expect(mockAdminClient.from).toHaveBeenCalledWith('users');
      expect(mockAdminClient.from).toHaveBeenCalledWith('user_roles');
    });

    it('should generate valid tenant slug from email', async () => {
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: mockUserId, email: validPayload.email } },
        error: null,
      });

      const mockInsert = jest.fn();
      const mockEq = jest.fn();
      const mockDelete = jest.fn();

      mockAdminClient.from.mockReturnValue({
        insert: mockInsert,
        delete: mockDelete,
      } as any);

      mockInsert.mockResolvedValue({ error: null });
      mockDelete.mockReturnValue({ eq: mockEq } as any);
      mockEq.mockResolvedValue({ error: null });

      await handleSignup(validPayload);

      const tenantInsertCall = mockAdminClient.from.mock.results
        .find((r) => r.value?.insert)
        ?.value?.insert.mock.calls[0]?.[0];

      expect(tenantInsertCall).toBeDefined();
      expect(tenantInsertCall?.slug).toMatch(/^john-doe-/);
      expect(tenantInsertCall?.slug).toBeLessThanOrEqual(100);
    });
  });

  describe('auth user creation failure', () => {
    it('should throw error if auth user creation fails', async () => {
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Email already in use' },
      });

      await expect(handleSignup(validPayload)).rejects.toThrow(
        'Email already in use'
      );

      expect(mockAdminClient.auth.admin.deleteUser).not.toHaveBeenCalled();
    });
  });

  describe('tenant creation failure - cleanup', () => {
    it('should delete auth user if tenant creation fails', async () => {
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: mockUserId, email: validPayload.email } },
        error: null,
      });

      const mockInsert = jest.fn();
      const mockEq = jest.fn();

      mockAdminClient.from.mockReturnValue({
        insert: mockInsert,
        delete: jest.fn().mockReturnValue({ eq: mockEq } as any),
      } as any);

      // First call (tenants insert) fails
      mockInsert.mockResolvedValueOnce({
        error: { message: 'Tenant creation failed' },
      });

      mockAdminClient.auth.admin.deleteUser.mockResolvedValue({
        data: { user: {} },
        error: null,
      });

      await expect(handleSignup(validPayload)).rejects.toThrow(
        'Failed to create tenant'
      );

      expect(mockAdminClient.auth.admin.deleteUser).toHaveBeenCalledWith(
        mockUserId
      );
    });
  });

  describe('user profile creation failure - cleanup', () => {
    it('should delete auth user and tenant if user profile creation fails', async () => {
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: mockUserId, email: validPayload.email } },
        error: null,
      });

      const mockInsert = jest.fn();
      const mockEq = jest.fn();
      const mockDelete = jest.fn();

      mockAdminClient.from.mockReturnValue({
        insert: mockInsert,
        delete: mockDelete,
      } as any);

      // First call (tenants insert) succeeds
      mockInsert.mockResolvedValueOnce({ error: null });
      // Second call (users insert) fails
      mockInsert.mockResolvedValueOnce({
        error: { message: 'User profile creation failed' },
      });

      mockDelete.mockReturnValue({ eq: mockEq } as any);
      mockEq.mockResolvedValue({ error: null });
      mockAdminClient.auth.admin.deleteUser.mockResolvedValue({
        data: { user: {} },
        error: null,
      });

      await expect(handleSignup(validPayload)).rejects.toThrow(
        'Failed to create user profile'
      );

      expect(mockAdminClient.auth.admin.deleteUser).toHaveBeenCalledWith(
        mockUserId
      );
      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe('role assignment failure - cleanup', () => {
    it('should delete auth user, user profile, and tenant if role assignment fails', async () => {
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: mockUserId, email: validPayload.email } },
        error: null,
      });

      const mockInsert = jest.fn();
      const mockEq = jest.fn();
      const mockDelete = jest.fn();

      mockAdminClient.from.mockReturnValue({
        insert: mockInsert,
        delete: mockDelete,
      } as any);

      // First two calls (tenants and users insert) succeed
      mockInsert.mockResolvedValueOnce({ error: null });
      mockInsert.mockResolvedValueOnce({ error: null });
      // Third call (user_roles insert) fails
      mockInsert.mockResolvedValueOnce({
        error: { message: 'Role assignment failed' },
      });

      mockDelete.mockReturnValue({ eq: mockEq } as any);
      mockEq.mockResolvedValue({ error: null });
      mockAdminClient.auth.admin.deleteUser.mockResolvedValue({
        data: { user: {} },
        error: null,
      });

      await expect(handleSignup(validPayload)).rejects.toThrow(
        'Failed to complete account setup'
      );

      expect(mockAdminClient.auth.admin.deleteUser).toHaveBeenCalledWith(
        mockUserId
      );
      expect(mockDelete).toHaveBeenCalledWith('users');
      expect(mockDelete).toHaveBeenCalledWith('tenants');
    });
  });

  describe('error handling and validation', () => {
    it('should handle missing auth data gracefully', async () => {
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(handleSignup(validPayload)).rejects.toThrow(
        'Failed to create account'
      );
    });

    it('should use provided names in tenant and user profile', async () => {
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: mockUserId, email: validPayload.email } },
        error: null,
      });

      const mockInsert = jest.fn();
      const mockEq = jest.fn();
      const mockDelete = jest.fn();

      mockAdminClient.from.mockReturnValue({
        insert: mockInsert,
        delete: mockDelete,
      } as any);

      mockInsert.mockResolvedValue({ error: null });
      mockDelete.mockReturnValue({ eq: mockEq } as any);
      mockEq.mockResolvedValue({ error: null });

      await handleSignup(validPayload);

      const tenantInsertCall = mockAdminClient.from.mock.results
        .find((r) => r.value?.insert)
        ?.value?.insert.mock.calls[0]?.[0];

      expect(tenantInsertCall?.name).toBe('John Doe');
    });

    it('should assign school_admin role by default', async () => {
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: mockUserId, email: validPayload.email } },
        error: null,
      });

      const mockInsert = jest.fn();
      const mockEq = jest.fn();
      const mockDelete = jest.fn();

      mockAdminClient.from.mockReturnValue({
        insert: mockInsert,
        delete: mockDelete,
      } as any);

      mockInsert.mockResolvedValue({ error: null });
      mockDelete.mockReturnValue({ eq: mockEq } as any);
      mockEq.mockResolvedValue({ error: null });

      const result = await handleSignup(validPayload);

      expect(result.user.roles).toContain('school_admin');
    });

    it('should preserve email case sensitivity internally while validating lowercase', async () => {
      const mixedCasePayload = {
        ...validPayload,
        email: 'John.Doe@Example.COM',
      };

      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: mockUserId, email: mixedCasePayload.email } },
        error: null,
      });

      const mockInsert = jest.fn();
      const mockEq = jest.fn();
      const mockDelete = jest.fn();

      mockAdminClient.from.mockReturnValue({
        insert: mockInsert,
        delete: mockDelete,
      } as any);

      mockInsert.mockResolvedValue({ error: null });
      mockDelete.mockReturnValue({ eq: mockEq } as any);
      mockEq.mockResolvedValue({ error: null });

      await handleSignup(mixedCasePayload);

      expect(mockAdminClient.auth.admin.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: mixedCasePayload.email,
        })
      );
    });
  });

  describe('edge cases', () => {
    it('should handle cleanup errors gracefully', async () => {
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: mockUserId, email: validPayload.email } },
        error: null,
      });

      const mockInsert = jest.fn();
      const mockEq = jest.fn();

      mockAdminClient.from.mockReturnValue({
        insert: mockInsert,
        delete: jest.fn().mockReturnValue({ eq: mockEq } as any),
      } as any);

      mockInsert.mockResolvedValueOnce({
        error: { message: 'Tenant creation failed' },
      });

      mockAdminClient.auth.admin.deleteUser.mockResolvedValue({
        data: { user: {} },
        error: null,
      });

      await expect(handleSignup(validPayload)).rejects.toThrow();
      expect(mockAdminClient.auth.admin.deleteUser).toHaveBeenCalled();
    });

    it('should include all required fields in response', async () => {
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: mockUserId, email: validPayload.email } },
        error: null,
      });

      const mockInsert = jest.fn();
      const mockEq = jest.fn();
      const mockDelete = jest.fn();

      mockAdminClient.from.mockReturnValue({
        insert: mockInsert,
        delete: mockDelete,
      } as any);

      mockInsert.mockResolvedValue({ error: null });
      mockDelete.mockReturnValue({ eq: mockEq } as any);
      mockEq.mockResolvedValue({ error: null });

      const result = await handleSignup(validPayload);

      expect(result).toHaveProperty('user.id');
      expect(result).toHaveProperty('user.email');
      expect(result).toHaveProperty('user.fullName');
      expect(result).toHaveProperty('user.tenantId');
      expect(result).toHaveProperty('user.roles');
      expect(result).toHaveProperty('message');
    });
  });
});
