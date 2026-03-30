# Authentication API Examples

This file contains real-world examples of how to use the authentication and RBAC system.

## Table of Contents
1. [Basic Protected Route](#basic-protected-route)
2. [Permission-Based Access](#permission-based-access)
3. [Role-Based Access](#role-based-access)
4. [Conditional Authorization](#conditional-authorization)
5. [Tenant Isolation](#tenant-isolation)
6. [Error Handling](#error-handling)
7. [Client-Side Integration](#client-side-integration)

## Basic Protected Route

This example shows a simple protected endpoint that requires authentication:

```typescript
// apps/backend/src/app/api/v1/children/route.ts
import { requireAuth } from '@/lib/auth/rbac';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export const GET = requireAuth(async (req, user) => {
  // user is guaranteed to be authenticated
  // user object contains: id, email, tenantId, roles, permissions, fullName

  const adminClient = getSupabaseServerClient();

  // Fetch children for this tenant
  const { data: children, error } = await adminClient
    .from('children')
    .select('*')
    .eq('tenant_id', user.tenantId)
    .order('first_name');

  if (error) {
    console.error('Error fetching children:', error);
    return NextResponse.json(
      { error: 'Failed to fetch children' },
      { status: 500 }
    );
  }

  return NextResponse.json({ children });
});
```

## Permission-Based Access

This example checks for specific permissions:

```typescript
// apps/backend/src/app/api/v1/children/[id]/route.ts
import { requirePermission, hasPermission } from '@/lib/auth/rbac';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

// Only users with 'delete:children' permission can delete
export const DELETE = requirePermission('delete:children', async (req, user) => {
  const { searchParams } = new URL(req.url);
  const childId = searchParams.get('id');

  if (!childId) {
    return NextResponse.json(
      { error: 'Child ID is required' },
      { status: 400 }
    );
  }

  const adminClient = getSupabaseServerClient();

  // Delete the child
  const { error } = await adminClient
    .from('children')
    .delete()
    .eq('id', childId)
    .eq('tenant_id', user.tenantId);

  if (error) {
    return NextResponse.json(
      { error: 'Failed to delete child' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, message: 'Child deleted' });
});

// Update requires 'write:children' permission
export const PATCH = requirePermission('write:children', async (req, user) => {
  const { searchParams } = new URL(req.url);
  const childId = searchParams.get('id');
  const body = await req.json();

  const adminClient = getSupabaseServerClient();

  const { data, error } = await adminClient
    .from('children')
    .update(body)
    .eq('id', childId)
    .eq('tenant_id', user.tenantId)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: 'Failed to update child' },
      { status: 500 }
    );
  }

  return NextResponse.json({ child: data });
});
```

## Role-Based Access

This example checks for specific roles:

```typescript
// apps/backend/src/app/api/v1/billing/route.ts
import { requireRole } from '@/lib/auth/rbac';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

// Only admins can access billing information
export const GET = requireRole('admin', async (req, user) => {
  const adminClient = getSupabaseServerClient();

  const { data: billing, error } = await adminClient
    .from('billing')
    .select('*')
    .eq('tenant_id', user.tenantId)
    .single();

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch billing' },
      { status: 500 }
    );
  }

  return NextResponse.json({ billing });
});
```

## Conditional Authorization

This example shows conditional authorization logic within a handler:

```typescript
// apps/backend/src/app/api/v1/reports/route.ts
import { requireAuth, hasPermission, hasRole, checkPermissionOrThrow } from '@/lib/auth/rbac';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export const GET = requireAuth(async (req, user) => {
  const adminClient = getSupabaseServerClient();
  const { searchParams } = new URL(req.url);
  const reportType = searchParams.get('type') || 'summary';

  // All authenticated users can get summary reports
  if (reportType === 'summary') {
    const { data, error } = await adminClient
      .from('reports')
      .select('*')
      .eq('tenant_id', user.tenantId)
      .eq('type', 'summary');

    return NextResponse.json({ reports: data });
  }

  // Detailed reports require 'read:employees' permission
  if (reportType === 'detailed') {
    if (!hasPermission(user, 'read:employees')) {
      return NextResponse.json(
        { error: 'You do not have permission to view detailed reports' },
        { status: 403 }
      );
    }

    const { data, error } = await adminClient
      .from('reports')
      .select('*')
      .eq('tenant_id', user.tenantId)
      .eq('type', 'detailed');

    return NextResponse.json({ reports: data });
  }

  // Sensitive reports require admin role
  if (reportType === 'sensitive') {
    try {
      checkPermissionOrThrow(user, 'manage:billing');
    } catch (error) {
      return NextResponse.json(
        { error: 'You do not have permission to view sensitive reports' },
        { status: 403 }
      );
    }

    const { data, error } = await adminClient
      .from('reports')
      .select('*')
      .eq('tenant_id', user.tenantId)
      .eq('type', 'sensitive');

    return NextResponse.json({ reports: data });
  }

  return NextResponse.json(
    { error: 'Invalid report type' },
    { status: 400 }
  );
});
```

## Tenant Isolation

This example demonstrates proper tenant isolation:

```typescript
// apps/backend/src/app/api/v1/employees/route.ts
import { requireAuth } from '@/lib/auth/rbac';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export const GET = requireAuth(async (req, user) => {
  const adminClient = getSupabaseServerClient();

  // IMPORTANT: Always filter by user.tenantId
  // This ensures users can only access their own tenant's data
  const { data: employees, error } = await adminClient
    .from('employees')
    .select('id, first_name, last_name, email, role, hire_date')
    .eq('tenant_id', user.tenantId)
    .order('first_name');

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }

  return NextResponse.json({ employees });
});

export const POST = requireAuth(async (req, user) => {
  const body = await req.json();

  // Validate required fields
  if (!body.firstName || !body.lastName || !body.email) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  const adminClient = getSupabaseServerClient();

  // Create new employee, always set tenant_id
  const { data: employee, error } = await adminClient
    .from('employees')
    .insert({
      tenant_id: user.tenantId, // CRITICAL: Set from authenticated user
      first_name: body.firstName,
      last_name: body.lastName,
      email: body.email,
      role: body.role || 'employee',
      hire_date: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: 'Failed to create employee' },
      { status: 500 }
    );
  }

  return NextResponse.json({ employee }, { status: 201 });
});
```

## Error Handling

This example shows comprehensive error handling:

```typescript
// apps/backend/src/app/api/v1/children/[id]/medical-notes/route.ts
import { requirePermission } from '@/lib/auth/rbac';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export const PUT = requirePermission('write:children', async (req, user) => {
  try {
    const { searchParams } = new URL(req.url);
    const childId = searchParams.get('id');

    // Validate input
    if (!childId) {
      return NextResponse.json(
        {
          error: 'Child ID is required',
          code: 'MISSING_CHILD_ID',
        },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Validate payload
    if (typeof body.medicalNotes !== 'string') {
      return NextResponse.json(
        {
          error: 'Medical notes must be a string',
          code: 'INVALID_PAYLOAD',
        },
        { status: 400 }
      );
    }

    const adminClient = getSupabaseServerClient();

    // Check if child exists and belongs to user's tenant
    const { data: child, error: fetchError } = await adminClient
      .from('children')
      .select('id')
      .eq('id', childId)
      .eq('tenant_id', user.tenantId)
      .single();

    if (fetchError || !child) {
      return NextResponse.json(
        {
          error: 'Child not found',
          code: 'CHILD_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Update medical notes
    const { data: updated, error: updateError } = await adminClient
      .from('children')
      .update({ medical_notes: body.medicalNotes })
      .eq('id', childId)
      .select()
      .single();

    if (updateError) {
      console.error('Database error:', updateError);
      return NextResponse.json(
        {
          error: 'Failed to update medical notes',
          code: 'UPDATE_FAILED',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ child: updated });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
});
```

## Client-Side Integration

This example shows how to integrate with the authentication API from a client application:

```typescript
// Example client code (e.g., React)

// 1. Sign up
async function signup(
  email: string,
  password: string,
  fullName: string,
  tenantSlug: string
) {
  const response = await fetch('/api/v1/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      fullName,
      tenantSlug,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return response.json();
}

// 2. Login
async function login(email: string, password: string) {
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  const data = await response.json();
  // Store tokens in localStorage (or secure storage)
  localStorage.setItem('accessToken', data.session.accessToken);
  localStorage.setItem('refreshToken', data.session.refreshToken);
  return data;
}

// 3. Get current user
async function getCurrentUser(token: string) {
  const response = await fetch('/api/v1/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }

  return response.json();
}

// 4. Refresh token
async function refreshToken(refreshToken: string) {
  const response = await fetch('/api/v1/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  const data = await response.json();
  localStorage.setItem('accessToken', data.accessToken);
  return data;
}

// 5. Protected API call
async function fetchChildren(token: string) {
  const response = await fetch('/api/v1/children', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized');
    }
    throw new Error('Failed to fetch children');
  }

  return response.json();
}
```

## Advanced Patterns

### Audit Logging

```typescript
import { requirePermission } from '@/lib/auth/rbac';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

async function auditLog(
  adminClient: any,
  userId: string,
  tenantId: string,
  action: string,
  resource: string,
  resourceId: string,
  details?: any
) {
  await adminClient
    .from('audit_logs')
    .insert({
      user_id: userId,
      tenant_id: tenantId,
      action,
      resource,
      resource_id: resourceId,
      details,
      timestamp: new Date().toISOString(),
    })
    .catch(console.error); // Don't fail if logging fails
}

export const DELETE = requirePermission('delete:children', async (req, user) => {
  const { searchParams } = new URL(req.url);
  const childId = searchParams.get('id');

  const adminClient = getSupabaseServerClient();

  const { error } = await adminClient
    .from('children')
    .delete()
    .eq('id', childId)
    .eq('tenant_id', user.tenantId);

  if (!error) {
    // Log the action
    await auditLog(
      adminClient,
      user.id,
      user.tenantId,
      'DELETE',
      'children',
      childId,
      { deletedBy: user.email }
    );
  }

  if (error) {
    return NextResponse.json(
      { error: 'Failed to delete' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
});
```

### Pagination

```typescript
export const GET = requireAuth(async (req, user) => {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  // Validate pagination params
  if (page < 1 || limit < 1 || limit > 100) {
    return NextResponse.json(
      { error: 'Invalid pagination parameters' },
      { status: 400 }
    );
  }

  const offset = (page - 1) * limit;

  const adminClient = getSupabaseServerClient();

  // Get total count
  const { count } = await adminClient
    .from('children')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', user.tenantId);

  // Get paginated results
  const { data: children } = await adminClient
    .from('children')
    .select('*')
    .eq('tenant_id', user.tenantId)
    .order('first_name')
    .range(offset, offset + limit - 1);

  return NextResponse.json({
    data: children,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  });
});
```

### Search and Filter

```typescript
export const GET = requireAuth(async (req, user) => {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');
  const role = searchParams.get('role');

  let queryBuilder = getSupabaseServerClient()
    .from('employees')
    .select('*')
    .eq('tenant_id', user.tenantId);

  // Search by name or email
  if (query) {
    queryBuilder = queryBuilder.or(
      `first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`
    );
  }

  // Filter by role
  if (role) {
    queryBuilder = queryBuilder.eq('role', role);
  }

  const { data, error } = await queryBuilder.order('first_name');

  if (error) {
    return NextResponse.json(
      { error: 'Failed to search employees' },
      { status: 500 }
    );
  }

  return NextResponse.json({ employees: data });
});
```
