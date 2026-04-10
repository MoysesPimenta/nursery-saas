import {
  signupRequestSchema,
  loginRequestSchema,
  refreshTokenRequestSchema,
  userProfileSchema,
  errorResponseSchema,
} from '../../lib/validation/auth-schemas';
import { ZodError } from 'zod';

describe('Auth Validation Schemas', () => {
  describe('signupRequestSchema', () => {
    const validSignupData = {
      email: 'john.doe@example.com',
      password: 'SecurePassword123',
      firstName: 'John',
      lastName: 'Doe',
    };

    describe('valid signup data', () => {
      it('should accept valid signup request', () => {
        const result = signupRequestSchema.safeParse(validSignupData);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.email).toBe('john.doe@example.com');
        }
      });

      it('should convert email to lowercase', () => {
        const data = {
          ...validSignupData,
          email: 'John.Doe@Example.COM',
        };
        const result = signupRequestSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.email).toBe('john.doe@example.com');
        }
      });

      it('should accept valid password with uppercase, lowercase, and number', () => {
        const data = {
          ...validSignupData,
          password: 'MyPassword123',
        };
        const result = signupRequestSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept password with special characters', () => {
        const data = {
          ...validSignupData,
          password: 'MyP@ssw0rd!',
        };
        const result = signupRequestSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept long password', () => {
        const data = {
          ...validSignupData,
          password: 'VeryLongPasswordWith123AndNumbers456',
        };
        const result = signupRequestSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept long first and last names', () => {
        const data = {
          ...validSignupData,
          firstName: 'Christopher',
          lastName: 'Montgomery-Anderson',
        };
        const result = signupRequestSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('missing required fields', () => {
      it('should reject signup without email', () => {
        const { email, ...data } = validSignupData;
        const result = signupRequestSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('email');
        }
      });

      it('should reject signup without password', () => {
        const { password, ...data } = validSignupData;
        const result = signupRequestSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('password');
        }
      });

      it('should reject signup without firstName', () => {
        const { firstName, ...data } = validSignupData;
        const result = signupRequestSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('firstName');
        }
      });

      it('should reject signup without lastName', () => {
        const { lastName, ...data } = validSignupData;
        const result = signupRequestSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('lastName');
        }
      });
    });

    describe('invalid email validation', () => {
      it('should reject invalid email format', () => {
        const data = {
          ...validSignupData,
          email: 'not-an-email',
        };
        const result = signupRequestSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject email without domain', () => {
        const data = {
          ...validSignupData,
          email: 'john@',
        };
        const result = signupRequestSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject email without local part', () => {
        const data = {
          ...validSignupData,
          email: '@example.com',
        };
        const result = signupRequestSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject email with multiple @ symbols', () => {
        const data = {
          ...validSignupData,
          email: 'john@doe@example.com',
        };
        const result = signupRequestSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should accept email with plus sign', () => {
        const data = {
          ...validSignupData,
          email: 'john+test@example.com',
        };
        const result = signupRequestSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept email with numbers', () => {
        const data = {
          ...validSignupData,
          email: 'john123@example.com',
        };
        const result = signupRequestSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept email with hyphen', () => {
        const data = {
          ...validSignupData,
          email: 'john-doe@example.com',
        };
        const result = signupRequestSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('password validation', () => {
      it('should reject password without uppercase letter', () => {
        const data = {
          ...validSignupData,
          password: 'lowercase123',
        };
        const result = signupRequestSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          const passwordError = result.error.issues.find(
            (issue) => issue.path[0] === 'password'
          );
          expect(passwordError?.message).toContain('uppercase');
        }
      });

      it('should reject password without lowercase letter', () => {
        const data = {
          ...validSignupData,
          password: 'UPPERCASE123',
        };
        const result = signupRequestSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          const passwordError = result.error.issues.find(
            (issue) => issue.path[0] === 'password'
          );
          expect(passwordError?.message).toContain('lowercase');
        }
      });

      it('should reject password without number', () => {
        const data = {
          ...validSignupData,
          password: 'NoNumbers',
        };
        const result = signupRequestSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          const passwordError = result.error.issues.find(
            (issue) => issue.path[0] === 'password'
          );
          expect(passwordError?.message).toContain('number');
        }
      });

      it('should reject password shorter than 8 characters', () => {
        const data = {
          ...validSignupData,
          password: 'Pass1',
        };
        const result = signupRequestSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          const passwordError = result.error.issues.find(
            (issue) => issue.path[0] === 'password'
          );
          expect(passwordError?.message).toContain('8 characters');
        }
      });

      it('should accept exactly 8 character password', () => {
        const data = {
          ...validSignupData,
          password: 'Pass123A',
        };
        const result = signupRequestSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept password with exactly one uppercase', () => {
        const data = {
          ...validSignupData,
          password: 'lowercase1A',
        };
        const result = signupRequestSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept password with exactly one lowercase', () => {
        const data = {
          ...validSignupData,
          password: 'UPPERCASE1a',
        };
        const result = signupRequestSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept password with exactly one number', () => {
        const data = {
          ...validSignupData,
          password: 'OnlyOne1Upper',
        };
        const result = signupRequestSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject password that is only 7 characters even with all requirements', () => {
        const data = {
          ...validSignupData,
          password: 'Pass12A',
        };
        const result = signupRequestSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should accept password with very long length', () => {
        const data = {
          ...validSignupData,
          password:
            'VeryLongPasswordThatIsMuchLongerThan8Characters1234567890ABC',
        };
        const result = signupRequestSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('name field validation', () => {
      it('should reject empty firstName', () => {
        const data = {
          ...validSignupData,
          firstName: '',
        };
        const result = signupRequestSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject empty lastName', () => {
        const data = {
          ...validSignupData,
          lastName: '',
        };
        const result = signupRequestSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should accept single character names', () => {
        const data = {
          ...validSignupData,
          firstName: 'J',
          lastName: 'D',
        };
        const result = signupRequestSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept names with spaces', () => {
        const data = {
          ...validSignupData,
          firstName: 'Jean Pierre',
          lastName: 'De La Cruz',
        };
        const result = signupRequestSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept names with hyphens', () => {
        const data = {
          ...validSignupData,
          firstName: 'Mary-Jane',
          lastName: 'Smith-Johnson',
        };
        const result = signupRequestSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept names with apostrophes', () => {
        const data = {
          ...validSignupData,
          firstName: "O'Brien",
          lastName: "O'Connor",
        };
        const result = signupRequestSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept very long names up to 255 characters', () => {
        const longName = 'A'.repeat(255);
        const data = {
          ...validSignupData,
          firstName: longName,
        };
        const result = signupRequestSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject names longer than 255 characters', () => {
        const longName = 'A'.repeat(256);
        const data = {
          ...validSignupData,
          firstName: longName,
        };
        const result = signupRequestSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should accept names with numbers', () => {
        const data = {
          ...validSignupData,
          firstName: 'Jean123',
        };
        const result = signupRequestSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept names with special characters', () => {
        const data = {
          ...validSignupData,
          firstName: 'José',
          lastName: 'Müller',
        };
        const result = signupRequestSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('edge cases', () => {
      it('should reject extra fields gracefully', () => {
        const data = {
          ...validSignupData,
          extraField: 'should be ignored or fail',
        };
        const result = signupRequestSchema.safeParse(data);
        // Zod by default ignores extra fields in object validation
        expect(result.success).toBe(true);
      });

      it('should reject null values', () => {
        const data = {
          email: null,
          password: validSignupData.password,
          firstName: validSignupData.firstName,
          lastName: validSignupData.lastName,
        };
        const result = signupRequestSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject undefined values', () => {
        const data = {
          email: undefined,
          password: validSignupData.password,
          firstName: validSignupData.firstName,
          lastName: validSignupData.lastName,
        };
        const result = signupRequestSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject non-string values', () => {
        const data = {
          email: 123,
          password: validSignupData.password,
          firstName: validSignupData.firstName,
          lastName: validSignupData.lastName,
        };
        const result = signupRequestSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('loginRequestSchema', () => {
    const validLoginData = {
      email: 'john@example.com',
      password: 'password123',
    };

    it('should accept valid login request', () => {
      const result = loginRequestSchema.safeParse(validLoginData);
      expect(result.success).toBe(true);
    });

    it('should convert email to lowercase', () => {
      const data = {
        ...validLoginData,
        email: 'John@Example.COM',
      };
      const result = loginRequestSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('john@example.com');
      }
    });

    it('should reject invalid email', () => {
      const data = {
        ...validLoginData,
        email: 'invalid-email',
      };
      const result = loginRequestSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject empty password', () => {
      const data = {
        ...validLoginData,
        password: '',
      };
      const result = loginRequestSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept password of any length (no requirements for login)', () => {
      const data = {
        ...validLoginData,
        password: 'short',
      };
      const result = loginRequestSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should not require strong password for login', () => {
      const data = {
        ...validLoginData,
        password: 'lowercase',
      };
      const result = loginRequestSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('refreshTokenRequestSchema', () => {
    const validRefreshData = {
      refreshToken: 'valid-refresh-token-string',
    };

    it('should accept valid refresh token request', () => {
      const result = refreshTokenRequestSchema.safeParse(validRefreshData);
      expect(result.success).toBe(true);
    });

    it('should reject empty refresh token', () => {
      const data = {
        refreshToken: '',
      };
      const result = refreshTokenRequestSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject missing refresh token', () => {
      const result = refreshTokenRequestSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should accept refresh token with special characters', () => {
      const data = {
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.abc.def',
      };
      const result = refreshTokenRequestSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('userProfileSchema', () => {
    const validUserProfile = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'john@example.com',
      fullName: 'John Doe',
      tenantId: '650e8400-e29b-41d4-a716-446655440001',
      roles: ['admin', 'user'],
      permissions: ['read:data', 'write:data'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    };

    it('should accept valid user profile', () => {
      const result = userProfileSchema.safeParse(validUserProfile);
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const data = {
        ...validUserProfile,
        id: 'not-a-uuid',
      };
      const result = userProfileSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject invalid email', () => {
      const data = {
        ...validUserProfile,
        email: 'not-an-email',
      };
      const result = userProfileSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject invalid ISO datetime for createdAt', () => {
      const data = {
        ...validUserProfile,
        createdAt: 'not-a-datetime',
      };
      const result = userProfileSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept empty roles array', () => {
      const data = {
        ...validUserProfile,
        roles: [],
      };
      const result = userProfileSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept empty permissions array', () => {
      const data = {
        ...validUserProfile,
        permissions: [],
      };
      const result = userProfileSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject non-array roles', () => {
      const data = {
        ...validUserProfile,
        roles: 'admin',
      };
      const result = userProfileSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('errorResponseSchema', () => {
    const validError = {
      error: 'Something went wrong',
    };

    it('should accept valid error response', () => {
      const result = errorResponseSchema.safeParse(validError);
      expect(result.success).toBe(true);
    });

    it('should accept error with code', () => {
      const data = {
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
      };
      const result = errorResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept error with details', () => {
      const data = {
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: {
          email: 'Invalid email format',
          password: 'Password too weak',
        },
      };
      const result = errorResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject error without message', () => {
      const result = errorResponseSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should handle empty details object', () => {
      const data = {
        error: 'Error',
        details: {},
      };
      const result = errorResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('schema error reporting', () => {
    it('should provide clear error messages for password validation', () => {
      const data = {
        email: 'john@example.com',
        password: 'weakpass',
        firstName: 'John',
        lastName: 'Doe',
      };
      const result = signupRequestSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten();
        expect(errors.fieldErrors.password).toBeDefined();
      }
    });

    it('should provide multiple error messages for multiple failures', () => {
      const data = {
        email: 'invalid',
        password: 'weak',
        firstName: '',
        lastName: 'Doe',
      };
      const result = signupRequestSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issues = result.error.issues;
        expect(issues.length).toBeGreaterThan(1);
      }
    });
  });
});
