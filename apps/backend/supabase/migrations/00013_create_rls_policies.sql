-- Helper functions for RLS policies
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::UUID,
    auth.uid()::UUID
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT current_setting('request.jwt.claims', true)::jsonb ->> 'role';
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_id()
RETURNS UUID AS $$
  SELECT auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = get_user_id()
    AND r.name = 'super_admin'
    LIMIT 1
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_tenant_admin(tenant_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = get_user_id()
    AND ur.tenant_id = $1
    AND r.name IN ('super_admin', 'school_admin')
    LIMIT 1
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.user_has_role(role_name TEXT, tenant_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = get_user_id()
    AND ur.tenant_id = $2
    AND r.name = $1
    LIMIT 1
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_field_values ENABLE ROW LEVEL SECURITY;

-- TENANTS POLICIES
CREATE POLICY "super_admin_all_tenants" ON public.tenants
  FOR ALL USING (is_super_admin());

CREATE POLICY "users_read_own_tenant" ON public.tenants
  FOR SELECT USING (
    id IN (SELECT tenant_id FROM public.users WHERE id = get_user_id())
  );

-- USERS POLICIES
CREATE POLICY "tenant_admin_manage_users" ON public.users
  FOR ALL USING (is_tenant_admin(tenant_id));

CREATE POLICY "users_read_own_tenant_users" ON public.users
  FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = get_user_id()));

CREATE POLICY "users_read_own_profile" ON public.users
  FOR SELECT USING (id = get_user_id());

-- USER_ROLES POLICIES
CREATE POLICY "tenant_admin_manage_roles" ON public.user_roles
  FOR ALL USING (is_tenant_admin(tenant_id));

CREATE POLICY "read_own_tenant_roles" ON public.user_roles
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM public.users WHERE id = get_user_id())
  );

-- ROLES POLICIES
CREATE POLICY "all_read_system_roles" ON public.roles
  FOR SELECT USING (is_system = true);

CREATE POLICY "tenant_read_own_custom_roles" ON public.roles
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM public.users WHERE id = get_user_id())
  );

CREATE POLICY "tenant_admin_manage_custom_roles" ON public.roles
  FOR ALL USING (
    tenant_id IS NOT NULL AND is_tenant_admin(tenant_id)
  );

-- PERMISSIONS POLICIES (read-only, everyone can read)
CREATE POLICY "all_read_permissions" ON public.permissions
  FOR SELECT USING (true);

-- ROLE_PERMISSIONS POLICIES
CREATE POLICY "all_read_role_permissions" ON public.role_permissions
  FOR SELECT USING (true);

-- CLASSES POLICIES
CREATE POLICY "tenant_users_read_classes" ON public.classes
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM public.users WHERE id = get_user_id())
  );

CREATE POLICY "teacher_manage_own_class" ON public.classes
  FOR ALL USING (
    teacher_id = get_user_id() AND
    tenant_id IN (SELECT tenant_id FROM public.users WHERE id = get_user_id())
  );

CREATE POLICY "admin_manage_classes" ON public.classes
  FOR ALL USING (is_tenant_admin(tenant_id));

-- DEPARTMENTS POLICIES
CREATE POLICY "tenant_read_departments" ON public.departments
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM public.users WHERE id = get_user_id())
  );

CREATE POLICY "admin_manage_departments" ON public.departments
  FOR ALL USING (is_tenant_admin(tenant_id));

-- CHILDREN POLICIES
CREATE POLICY "nurse_manage_children" ON public.children
  FOR ALL USING (
    user_has_role('nurse', tenant_id) AND
    tenant_id IN (SELECT tenant_id FROM public.users WHERE id = get_user_id())
  );

CREATE POLICY "teacher_read_class_children" ON public.children
  FOR SELECT USING (
    class_id IN (
      SELECT id FROM public.classes WHERE teacher_id = get_user_id()
    )
  );

CREATE POLICY "admin_manage_children" ON public.children
  FOR ALL USING (is_tenant_admin(tenant_id));

CREATE POLICY "parent_read_own_children" ON public.children
  FOR SELECT USING (
    id IN (
      SELECT child_id FROM public.child_parents WHERE parent_user_id = get_user_id()
    )
  );

CREATE POLICY "inspector_read_children" ON public.children
  FOR SELECT USING (
    user_has_role('inspector', tenant_id) AND
    tenant_id IN (SELECT tenant_id FROM public.users WHERE id = get_user_id())
  );

-- CHILD_PARENTS POLICIES
CREATE POLICY "parents_manage_own_relationship" ON public.child_parents
  FOR ALL USING (parent_user_id = get_user_id());

CREATE POLICY "admin_manage_relationships" ON public.child_parents
  FOR ALL USING (
    child_id IN (
      SELECT id FROM public.children WHERE tenant_id IN (
        SELECT tenant_id FROM public.users WHERE id = get_user_id()
      )
    ) AND is_tenant_admin(
      (SELECT tenant_id FROM public.children WHERE id = child_id)
    )
  );

-- EMPLOYEES POLICIES
CREATE POLICY "nurse_read_employees" ON public.employees
  FOR SELECT USING (
    user_has_role('nurse', tenant_id) AND
    tenant_id IN (SELECT tenant_id FROM public.users WHERE id = get_user_id())
  );

CREATE POLICY "admin_manage_employees" ON public.employees
  FOR ALL USING (is_tenant_admin(tenant_id));

CREATE POLICY "employees_read_own_record" ON public.employees
  FOR SELECT USING (
    user_id = get_user_id()
  );

-- MEDICATIONS POLICIES
CREATE POLICY "tenant_read_medications" ON public.medications
  FOR SELECT USING (
    is_active AND
    tenant_id IN (SELECT tenant_id FROM public.users WHERE id = get_user_id())
  );

CREATE POLICY "nurse_admin_manage_medications" ON public.medications
  FOR ALL USING (
    (user_has_role('nurse', tenant_id) OR is_tenant_admin(tenant_id)) AND
    tenant_id IN (SELECT tenant_id FROM public.users WHERE id = get_user_id())
  );

-- ALLERGIES POLICIES
CREATE POLICY "tenant_read_allergies" ON public.allergies
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM public.users WHERE id = get_user_id())
  );

CREATE POLICY "nurse_admin_manage_allergies" ON public.allergies
  FOR ALL USING (
    (user_has_role('nurse', tenant_id) OR is_tenant_admin(tenant_id)) AND
    tenant_id IN (SELECT tenant_id FROM public.users WHERE id = get_user_id())
  );

-- CHILD_MEDICATIONS POLICIES
CREATE POLICY "nurse_manage_child_medications" ON public.child_medications
  FOR ALL USING (
    child_id IN (
      SELECT id FROM public.children WHERE tenant_id IN (
        SELECT tenant_id FROM public.users WHERE id = get_user_id()
      )
    ) AND user_has_role('nurse', (SELECT tenant_id FROM public.children WHERE id = child_id))
  );

CREATE POLICY "parent_read_child_medications" ON public.child_medications
  FOR SELECT USING (
    child_id IN (
      SELECT child_id FROM public.child_parents WHERE parent_user_id = get_user_id()
    )
  );

-- CHILD_ALLERGIES POLICIES
CREATE POLICY "nurse_manage_child_allergies" ON public.child_allergies
  FOR ALL USING (
    child_id IN (
      SELECT id FROM public.children WHERE tenant_id IN (
        SELECT tenant_id FROM public.users WHERE id = get_user_id()
      )
    ) AND user_has_role('nurse', (SELECT tenant_id FROM public.children WHERE id = child_id))
  );

CREATE POLICY "parent_read_child_allergies" ON public.child_allergies
  FOR SELECT USING (
    child_id IN (
      SELECT child_id FROM public.child_parents WHERE parent_user_id = get_user_id()
    )
  );

-- EMPLOYEE_MEDICATIONS POLICIES
CREATE POLICY "nurse_manage_employee_medications" ON public.employee_medications
  FOR ALL USING (
    employee_id IN (
      SELECT id FROM public.employees WHERE tenant_id IN (
        SELECT tenant_id FROM public.users WHERE id = get_user_id()
      )
    ) AND user_has_role('nurse', (SELECT tenant_id FROM public.employees WHERE id = employee_id))
  );

CREATE POLICY "employee_read_own_medications" ON public.employee_medications
  FOR SELECT USING (
    employee_id IN (
      SELECT id FROM public.employees WHERE user_id = get_user_id()
    )
  );

-- EMPLOYEE_ALLERGIES POLICIES
CREATE POLICY "nurse_manage_employee_allergies" ON public.employee_allergies
  FOR ALL USING (
    employee_id IN (
      SELECT id FROM public.employees WHERE tenant_id IN (
        SELECT tenant_id FROM public.users WHERE id = get_user_id()
      )
    ) AND user_has_role('nurse', (SELECT tenant_id FROM public.employees WHERE id = employee_id))
  );

CREATE POLICY "employee_read_own_allergies" ON public.employee_allergies
  FOR SELECT USING (
    employee_id IN (
      SELECT id FROM public.employees WHERE user_id = get_user_id()
    )
  );

-- AUTHORIZATIONS POLICIES
CREATE POLICY "teacher_create_authorizations" ON public.authorizations
  FOR INSERT WITH CHECK (
    user_has_role('teacher', tenant_id) AND
    requested_by = get_user_id() AND
    tenant_id IN (SELECT tenant_id FROM public.users WHERE id = get_user_id())
  );

CREATE POLICY "nurse_manage_authorizations" ON public.authorizations
  FOR ALL USING (
    (user_has_role('nurse', tenant_id) OR is_tenant_admin(tenant_id)) AND
    tenant_id IN (SELECT tenant_id FROM public.users WHERE id = get_user_id())
  );

CREATE POLICY "teacher_read_own_authorizations" ON public.authorizations
  FOR SELECT USING (
    requested_by = get_user_id() AND
    tenant_id IN (SELECT tenant_id FROM public.users WHERE id = get_user_id())
  );

CREATE POLICY "parent_read_child_authorizations" ON public.authorizations
  FOR SELECT USING (
    child_id IN (
      SELECT child_id FROM public.child_parents WHERE parent_user_id = get_user_id()
    )
  );

-- VISITS POLICIES
CREATE POLICY "nurse_manage_visits" ON public.visits
  FOR ALL USING (
    user_has_role('nurse', tenant_id) AND
    nurse_id = get_user_id() AND
    tenant_id IN (SELECT tenant_id FROM public.users WHERE id = get_user_id())
  );

CREATE POLICY "admin_view_visits" ON public.visits
  FOR SELECT USING (is_tenant_admin(tenant_id));

CREATE POLICY "teacher_read_authorization_visits" ON public.visits
  FOR SELECT USING (
    authorization_id IN (
      SELECT id FROM public.authorizations WHERE requested_by = get_user_id()
    )
  );

CREATE POLICY "parent_read_child_visits" ON public.visits
  FOR SELECT USING (
    child_id IN (
      SELECT child_id FROM public.child_parents WHERE parent_user_id = get_user_id()
    )
  );

-- AUDIT_LOGS POLICIES (append-only, no update/delete)
CREATE POLICY "audit_logs_append_only" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "admin_read_audit_logs" ON public.audit_logs
  FOR SELECT USING (is_tenant_admin(tenant_id));

CREATE POLICY "super_admin_all_audit_logs" ON public.audit_logs
  FOR SELECT USING (is_super_admin());

-- CUSTOM_FIELDS POLICIES
CREATE POLICY "tenant_read_custom_fields" ON public.custom_fields
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM public.users WHERE id = get_user_id())
  );

CREATE POLICY "admin_manage_custom_fields" ON public.custom_fields
  FOR ALL USING (is_tenant_admin(tenant_id));

-- CUSTOM_FIELD_VALUES POLICIES
CREATE POLICY "tenant_read_field_values" ON public.custom_field_values
  FOR SELECT USING (
    custom_field_id IN (
      SELECT id FROM public.custom_fields WHERE tenant_id IN (
        SELECT tenant_id FROM public.users WHERE id = get_user_id()
      )
    )
  );

CREATE POLICY "admin_manage_field_values" ON public.custom_field_values
  FOR ALL USING (
    custom_field_id IN (
      SELECT id FROM public.custom_fields WHERE is_active AND tenant_id IN (
        SELECT tenant_id FROM public.users WHERE id = get_user_id()
      )
    ) AND is_tenant_admin(
      (SELECT tenant_id FROM public.custom_fields WHERE id = custom_field_id)
    )
  );
