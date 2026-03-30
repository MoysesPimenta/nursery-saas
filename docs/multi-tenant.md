# Multi-Tenant Architecture

This document describes the multi-tenant architecture and data isolation strategy for Nursery-SaaS.

## Overview

Nursery-SaaS is a multi-tenant SaaS platform serving multiple childcare facilities as independent tenants. Each tenant has complete data isolation and customization options while sharing infrastructure.

### Multi-Tenant Benefits

- **Cost Efficiency** - Shared infrastructure reduces per-customer costs
- **Scalability** - Single deployment scales to thousands of facilities
- **Maintenance** - Single codebase, centralized updates and security patches
- **Customization** - Per-tenant settings and custom fields
- **Data Compliance** - Logical data isolation meets regulatory requirements

## Data Isolation Strategy

### Row-Level Security (RLS)

The primary isolation mechanism is PostgreSQL Row-Level Security (RLS), which enforces data access at the database level.

**Key Principle:** Every table has a `tenant_id` column, and RLS policies ensure users can only see data for their assigned tenant.

### RLS Policy Examples

#### Children Table

```sql
-- Enforce tenant isolation on children table
ALTER TABLE children ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON children
  USING (tenant_id = auth.jwt()->'tenant_id'::text);

CREATE POLICY insert_own_tenant ON children
  FOR INSERT
  WITH CHECK (tenant_id = auth.jwt()->'tenant_id'::text);
```

#### Audit Logs Table

```sql
-- Audit logs read-only, scoped to tenant
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY view_own_tenant_logs ON audit_logs
  FOR SELECT
  USING (tenant_id = auth.jwt()->'tenant_id'::text);
```

#### Custom Fields

```sql
-- Custom fields isolated by tenant
ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON custom_fields
  USING (tenant_id = auth.jwt()->'tenant_id'::text);
```

### JWT Claims

Tenant ID is encoded in the JWT token during authentication:

```json
{
  "sub": "user-123",
  "email": "staff@daycare.com",
  "tenant_id": "tenant-abc123",
  "role": "staff",
  "permissions": ["view_children", "edit_attendance"],
  "iat": 1234567890,
  "exp": 1234571490
}
```

The RLS policy uses `auth.jwt()->'tenant_id'` to extract the tenant ID and enforce access control.

## Tenant Lifecycle

### Onboarding Process

1. **Registration** - Tenant admin creates account
   - Create tenant record in `tenants` table
   - Create admin user with `TENANT_ADMIN` role
   - Initialize tenant settings (timezone, capacity limits)

2. **Setup** - Admin configures facility
   - Create departments and classes
   - Add staff members
   - Configure custom fields
   - Set permissions and roles

3. **Data Loading** - Populate initial data
   - Import child records
   - Add authorized guardians
   - Configure medical information
   - Upload facility photos/documents

4. **Go-Live** - Start using system
   - Enable real data collection
   - Activate notifications
   - Begin attendance tracking

### Tenant Offboarding

1. **Grace Period** - 30 days retention after cancellation
2. **Data Export** - Allow full data export in standard format
3. **Backup** - Archive to long-term storage
4. **Deletion** - Securely delete all tenant data (GDPR compliance)

## Database Schema

### Tenant Root

All tables reference `tenants` table as root:

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status VARCHAR(20),
  settings JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  email TEXT NOT NULL,
  -- ... other columns
  UNIQUE(tenant_id, email)
);

CREATE TABLE children (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  first_name TEXT,
  last_name TEXT,
  -- ... other columns
  UNIQUE(tenant_id, id)
);

-- All other tables follow same pattern with tenant_id FK
```

## Scaling Strategy

### Horizontal Scaling

As the platform grows, tenants can be distributed across databases:

```
Database 1 (Primary)
├── Tenants: Group A-M
├── Users, Children, Classes, etc.

Database 2 (Primary)
├── Tenants: Group N-Z
├── Users, Children, Classes, etc.

Database N (Shard by tenant_id)
├── Dedicated for high-volume tenants
```

**Migration:** Use CDC (Change Data Capture) or ETL to migrate tenant data between databases without downtime.

### Shared Infrastructure

While data is isolated per-tenant, infrastructure is shared:

```
┌─────────────────────────────────────────┐
│         Shared Vercel Platform           │
│  - Single Next.js deployment             │
│  - CDN and edge functions                │
│  - Authentication service                │
└─────────────────────────────────────────┘
                    │
         ┌──────────┼──────────┐
         │          │          │
    ┌────▼──┐  ┌───▼──┐  ┌───▼──┐
    │ Tenant 1 │  │ Tenant 2 │  │ Tenant 3 │
    │ (Daycare │  │ (Preschool│ │(Nursery) │
    │  ABC)    │  │  XYZ)    │  │   123)   │
    └────┬──┘  └───┬──┘  └───┬──┘
         │         │         │
    PostgreSQL + RLS Policies (Shared Database)
```

## Custom Fields per Tenant

Tenants can add custom fields for child records, employees, etc.

### Custom Field Storage

```sql
CREATE TABLE custom_fields (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  entity_type VARCHAR(50), -- 'child', 'employee', 'visit'
  field_name TEXT,
  field_type VARCHAR(50), -- 'text', 'date', 'select', etc.
  field_config JSONB, -- validation rules, options
  required BOOLEAN,
  display_order INTEGER,
  created_at TIMESTAMP
);

CREATE TABLE custom_field_values (
  id UUID PRIMARY KEY,
  custom_field_id UUID REFERENCES custom_fields(id),
  entity_id UUID, -- child_id, employee_id, etc.
  value TEXT,
  created_at TIMESTAMP
);
```

### Example: Dietary Preferences Custom Field

Tenant creates custom field:
- Field Name: "Dietary Preferences"
- Entity Type: "child"
- Field Type: "multi-select"
- Options: ["Vegetarian", "Vegan", "Gluten-Free", "Kosher", "Halal"]
- Required: false

### API Response with Custom Fields

```json
{
  "child_id": "child_789",
  "first_name": "Emma",
  "last_name": "Johnson",
  "custom_fields": {
    "dietary_preferences": ["Vegetarian", "Gluten-Free"]
  }
}
```

## Tenant Settings & Configuration

Each tenant stores settings in JSON:

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  name TEXT,
  settings JSONB DEFAULT '{}'::jsonb
);
```

### Settings Schema

```json
{
  "timezone": "America/New_York",
  "locale": "en-US",
  "currency": "USD",
  "max_children_per_class": 15,
  "max_staff_per_class": 3,
  "attendance_mode": "manual", // "manual" or "biometric"
  "billing": {
    "plan": "professional",
    "billing_day": 1
  },
  "features": {
    "custom_reports": true,
    "mobile_app": true,
    "api_access": true
  },
  "notifications": {
    "email_on_checkin": true,
    "sms_alerts": true
  }
}
```

## Security Considerations

### Tenant ID Validation

Always validate tenant ID at multiple levels:

1. **JWT Token** - Extracted from authenticated token
2. **Route Parameter** - Validate against JWT tenant_id
3. **Database Query** - RLS policy enforces at DB level

```javascript
// Express.js middleware example
function validateTenantAccess(req, res, next) {
  const tokenTenantId = req.user.tenant_id;
  const paramTenantId = req.params.tenantId;

  if (tokenTenantId !== paramTenantId) {
    return res.status(403).json({
      error: 'Unauthorized access to tenant'
    });
  }

  next();
}
```

### Admin Access

Super Admin users access all tenants but with explicit tenant context:

```javascript
// Super admin can switch tenant context
POST /admin/switch-tenant/:tenantId
Authorization: Bearer <super_admin_token>

// JWT is updated with new tenant_id
{
  "sub": "admin-001",
  "role": "super_admin",
  "tenant_id": "tenant-switched-to",
  "impersonating": true
}
```

### Audit Logging

All cross-tenant admin actions are logged:

```json
{
  "timestamp": "2026-03-30T14:23:45Z",
  "event_type": "admin.tenant_access",
  "admin_id": "admin-001",
  "admin_tenant_id": "system",
  "accessed_tenant_id": "tenant-abc123",
  "action": "view_children",
  "impersonating": true,
  "ip_address": "192.168.1.1"
}
```

## Monitoring & Analytics

### Per-Tenant Metrics

```javascript
// Example: Get tenant metrics
GET /admin/tenants/:tenantId/metrics

{
  "tenant_id": "tenant-abc123",
  "active_users": 15,
  "total_children": 85,
  "active_classes": 6,
  "checkins_today": 78,
  "api_requests_24h": 5234,
  "storage_used_mb": 2048,
  "plan": "professional"
}
```

### Tenant Health Checks

Monitor per-tenant health:

```javascript
// Tenant health status
{
  "tenant_id": "tenant-abc123",
  "api_latency_ms": 145,
  "database_latency_ms": 23,
  "api_error_rate": 0.001,
  "api_availability": 99.98,
  "last_activity": "2026-03-30T14:23:00Z"
}
```

## Best Practices

1. **Always Include Tenant ID**
   - Every database record should include `tenant_id`
   - Every API request should specify tenant context

2. **Validate at Multiple Layers**
   - JWT token claims
   - Route parameters
   - Database queries with RLS

3. **Never Trust Client Tenant ID**
   - Always use authenticated JWT for tenant ID
   - Never accept tenant_id from query/body parameters

4. **Audit Cross-Tenant Access**
   - Log all admin actions on other tenants
   - Require approval for sensitive operations

5. **Performance Isolation**
   - Monitor per-tenant resource usage
   - Implement query limits per tenant
   - Use database connection pooling

6. **Data Export on Offboarding**
   - Provide full data export in standard format
   - Allow GDPR data portability requests
   - Retain backups for compliance period

## Disaster Recovery

### Per-Tenant Backups

```bash
# Backup single tenant
mysqldump --where="tenant_id='tenant-abc123'" > tenant-backup.sql

# Point-in-time recovery for tenant
RESTORE TABLE children FROM tenant-backup WHERE tenant_id='tenant-abc123'
```

### Cross-Tenant Impact Mitigation

Isolate failure domains:

```sql
-- Create separate index for high-volume tenant
CREATE INDEX idx_children_tenant_active
ON children(tenant_id, status)
WHERE status = 'active'
AND tenant_id = 'high-volume-tenant';
```

## Conclusion

The multi-tenant architecture provides:
- Strong data isolation via RLS
- Shared cost-efficient infrastructure
- Per-tenant customization and settings
- Scalable design for growth
- Regulatory compliance (GDPR, COPPA)

For questions or design changes, consult the security and architecture teams.
