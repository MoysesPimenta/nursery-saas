-- Roles table
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(name, tenant_id)
);

CREATE INDEX idx_roles_tenant ON public.roles(tenant_id);
CREATE INDEX idx_roles_system ON public.roles(is_system) WHERE is_system = true;

-- Permissions table
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(resource, action)
);

CREATE INDEX idx_permissions_resource ON public.permissions(resource);

-- Role-Permission junction table
CREATE TABLE public.role_permissions (
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role ON public.role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON public.role_permissions(permission_id);

-- Seed system roles (without tenant_id as they are global)
INSERT INTO public.roles (name, description, is_system, tenant_id) VALUES
  ('super_admin', 'Super administrator with full system access', true, NULL),
  ('school_admin', 'School administrator', true, NULL),
  ('nurse', 'School nurse', true, NULL),
  ('teacher', 'Teacher', true, NULL),
  ('inspector', 'Health inspector', true, NULL),
  ('parent', 'Parent or guardian', true, NULL),
  ('read_only', 'Read-only access', true, NULL);

-- Seed permissions based on operation matrix
-- Core entity permissions
INSERT INTO public.permissions (name, description, resource, action) VALUES
  -- Tenants
  ('manage_tenants', 'Create, update, delete tenants', 'tenants', 'manage'),
  ('view_tenants', 'View tenant information', 'tenants', 'read'),

  -- Users
  ('manage_users', 'Create, update, delete users in tenant', 'users', 'manage'),
  ('view_users', 'View users in tenant', 'users', 'read'),
  ('manage_user_roles', 'Assign/revoke user roles', 'users', 'manage_roles'),

  -- Children
  ('manage_children', 'Create, update, delete children records', 'children', 'manage'),
  ('view_children', 'View children records', 'children', 'read'),
  ('view_own_child', 'View own child records', 'children', 'read_own'),

  -- Classes
  ('manage_classes', 'Create, update, delete classes', 'classes', 'manage'),
  ('view_classes', 'View classes', 'classes', 'read'),

  -- Departments
  ('manage_departments', 'Create, update, delete departments', 'departments', 'manage'),
  ('view_departments', 'View departments', 'departments', 'read'),

  -- Employees
  ('manage_employees', 'Create, update, delete employees', 'employees', 'manage'),
  ('view_employees', 'View employees', 'employees', 'read'),

  -- Medications
  ('manage_medications', 'Create, update, delete medications in catalog', 'medications', 'manage'),
  ('view_medications', 'View medication catalog', 'medications', 'read'),
  ('administer_medications', 'Administer medications to children', 'medications', 'administer'),

  -- Allergies
  ('manage_allergies', 'Create, update, delete allergies in catalog', 'allergies', 'manage'),
  ('view_allergies', 'View allergy information', 'allergies', 'read'),

  -- Authorizations
  ('request_authorization', 'Request medical authorization', 'authorizations', 'create'),
  ('manage_authorizations', 'Accept/reject authorizations', 'authorizations', 'manage'),
  ('view_authorizations', 'View authorizations', 'authorizations', 'read'),

  -- Visits
  ('manage_visits', 'Create, update, delete visit records', 'visits', 'manage'),
  ('view_visits', 'View visit records', 'visits', 'read'),
  ('view_own_visits', 'View own visit history', 'visits', 'read_own'),

  -- Audit logs
  ('view_audit_logs', 'View audit logs', 'audit_logs', 'read'),

  -- Custom fields
  ('manage_custom_fields', 'Create, update, delete custom fields', 'custom_fields', 'manage'),
  ('view_custom_fields', 'View custom fields', 'custom_fields', 'read'),

  -- Reports
  ('view_reports', 'View health reports and statistics', 'reports', 'read'),
  ('export_data', 'Export data', 'reports', 'export');

-- Assign permissions to system roles
-- Super Admin - all permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.name = 'super_admin' AND r.is_system = true;

-- School Admin - manage within tenant
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.name = 'school_admin' AND r.is_system = true
AND p.action IN ('manage', 'read', 'manage_roles')
AND p.resource NOT IN ('tenants');

-- Nurse - medical records and authorizations
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.name = 'nurse' AND r.is_system = true
AND p.name IN (
  'view_children', 'manage_children',
  'view_classes', 'view_departments', 'view_employees',
  'manage_medications', 'view_medications', 'administer_medications',
  'manage_allergies', 'view_allergies',
  'manage_authorizations', 'view_authorizations',
  'manage_visits', 'view_visits',
  'view_custom_fields', 'view_reports'
);

-- Teacher - children in class and authorization requests
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.name = 'teacher' AND r.is_system = true
AND p.name IN (
  'view_children', 'view_classes',
  'view_medications', 'view_allergies',
  'request_authorization', 'view_authorizations',
  'view_reports'
);

-- Inspector - read-only access
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.name = 'inspector' AND r.is_system = true
AND p.action = 'read';

-- Parent - own child records
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.name = 'parent' AND r.is_system = true
AND p.name IN ('view_own_child', 'view_own_visits');

-- Read-only - all read permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.name = 'read_only' AND r.is_system = true
AND p.action = 'read';
