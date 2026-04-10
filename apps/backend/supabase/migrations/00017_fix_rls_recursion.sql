-- Migration 00017: Fix RLS infinite recursion
-- The problem: RLS policies on many tables used subqueries like
--   `tenant_id IN (SELECT users.tenant_id FROM users WHERE users.id = auth.uid())`
-- But the `users` table itself had RLS with the same self-referencing pattern,
-- causing infinite recursion when any INSERT/SELECT triggered policy evaluation.
--
-- The fix: Create a SECURITY DEFINER function `get_user_tenant_id()` that
-- bypasses RLS when fetching the current user's tenant_id. Then update all
-- policies to use this function instead of subquerying `users`.

-- 1. Create SECURITY DEFINER function to get current user's tenant_id
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

-- 2. Fix users table self-referencing policy
DROP POLICY IF EXISTS users_read_own_tenant_users ON public.users;
CREATE POLICY users_read_own_tenant_users ON public.users
  FOR SELECT USING (tenant_id = get_user_tenant_id());

-- 3. Fix children policies
DROP POLICY IF EXISTS inspector_read_children ON public.children;
CREATE POLICY inspector_read_children ON public.children
  FOR SELECT USING (user_has_role('inspector', tenant_id) AND tenant_id = get_user_tenant_id());

DROP POLICY IF EXISTS nurse_manage_children ON public.children;
CREATE POLICY nurse_manage_children ON public.children
  FOR ALL USING (user_has_role('nurse', tenant_id) AND tenant_id = get_user_tenant_id());

-- 4. Fix classes policies
DROP POLICY IF EXISTS tenant_users_read_classes ON public.classes;
CREATE POLICY tenant_users_read_classes ON public.classes
  FOR SELECT USING (tenant_id = get_user_tenant_id());

DROP POLICY IF EXISTS teacher_manage_own_class ON public.classes;
CREATE POLICY teacher_manage_own_class ON public.classes
  FOR ALL USING (teacher_id = auth.uid() AND tenant_id = get_user_tenant_id());

-- 5. Fix medications policies
DROP POLICY IF EXISTS nurse_admin_manage_medications ON public.medications;
CREATE POLICY nurse_admin_manage_medications ON public.medications
  FOR ALL USING ((user_has_role('nurse', tenant_id) OR is_tenant_admin(tenant_id)) AND tenant_id = get_user_tenant_id());

DROP POLICY IF EXISTS tenant_read_medications ON public.medications;
CREATE POLICY tenant_read_medications ON public.medications
  FOR SELECT USING (is_active AND tenant_id = get_user_tenant_id());

-- 6. Fix allergies policies
DROP POLICY IF EXISTS tenant_read_allergies ON public.allergies;
CREATE POLICY tenant_read_allergies ON public.allergies
  FOR SELECT USING (tenant_id = get_user_tenant_id());

DROP POLICY IF EXISTS nurse_admin_manage_allergies ON public.allergies;
CREATE POLICY nurse_admin_manage_allergies ON public.allergies
  FOR ALL USING ((user_has_role('nurse', tenant_id) OR is_tenant_admin(tenant_id)) AND tenant_id = get_user_tenant_id());

-- 7. Fix authorizations policies
DROP POLICY IF EXISTS teacher_read_own_authorizations ON public.authorizations;
CREATE POLICY teacher_read_own_authorizations ON public.authorizations
  FOR SELECT USING (requested_by = auth.uid() AND tenant_id = get_user_tenant_id());

DROP POLICY IF EXISTS nurse_manage_authorizations ON public.authorizations;
CREATE POLICY nurse_manage_authorizations ON public.authorizations
  FOR ALL USING ((user_has_role('nurse', tenant_id) OR is_tenant_admin(tenant_id)) AND tenant_id = get_user_tenant_id());

-- 8. Fix departments policy
DROP POLICY IF EXISTS tenant_read_departments ON public.departments;
CREATE POLICY tenant_read_departments ON public.departments
  FOR SELECT USING (tenant_id = get_user_tenant_id());

-- 9. Fix employees policies
DROP POLICY IF EXISTS nurse_read_employees ON public.employees;
CREATE POLICY nurse_read_employees ON public.employees
  FOR SELECT USING (user_has_role('nurse', tenant_id) AND tenant_id = get_user_tenant_id());

DROP POLICY IF EXISTS employees_read_own_record ON public.employees;
CREATE POLICY employees_read_own_record ON public.employees
  FOR SELECT USING (user_id = auth.uid() AND tenant_id = get_user_tenant_id());

-- 10. Fix roles policy
DROP POLICY IF EXISTS tenant_read_own_custom_roles ON public.roles;
CREATE POLICY tenant_read_own_custom_roles ON public.roles
  FOR SELECT USING (tenant_id = get_user_tenant_id());

-- 11. Fix tenants policy
DROP POLICY IF EXISTS users_read_own_tenant ON public.tenants;
CREATE POLICY users_read_own_tenant ON public.tenants
  FOR SELECT USING (id = get_user_tenant_id());

-- 12. Fix user_roles policy
DROP POLICY IF EXISTS read_own_tenant_roles ON public.user_roles;
CREATE POLICY read_own_tenant_roles ON public.user_roles
  FOR SELECT USING (tenant_id = get_user_tenant_id());

-- 13. Fix visits policies
DROP POLICY IF EXISTS nurse_manage_visits ON public.visits;
CREATE POLICY nurse_manage_visits ON public.visits
  FOR ALL USING (user_has_role('nurse', tenant_id) AND tenant_id = get_user_tenant_id());

DROP POLICY IF EXISTS parent_read_child_visits ON public.visits;
CREATE POLICY parent_read_child_visits ON public.visits
  FOR SELECT USING (child_id IN (SELECT child_id FROM child_parents WHERE parent_user_id = auth.uid()) AND tenant_id = get_user_tenant_id());

-- 14. Fix custom fields policies
DROP POLICY IF EXISTS tenant_read_custom_fields ON public.custom_fields;
CREATE POLICY tenant_read_custom_fields ON public.custom_fields
  FOR SELECT USING (tenant_id = get_user_tenant_id());

DROP POLICY IF EXISTS tenant_read_field_values ON public.custom_field_values;
CREATE POLICY tenant_read_field_values ON public.custom_field_values
  FOR SELECT USING (custom_field_id IN (SELECT id FROM custom_fields WHERE tenant_id = get_user_tenant_id()));

-- 15. Add description column to classes table (used by frontend but was missing)
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS description text;

-- 16. Fix audit_logs INSERT policy (still referenced FROM users)
DROP POLICY IF EXISTS audit_logs_append_only ON public.audit_logs;
CREATE POLICY audit_logs_append_only ON public.audit_logs
  FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

-- 17. Fix authorizations teacher_create policy (still referenced FROM users)
DROP POLICY IF EXISTS teacher_create_authorizations ON public.authorizations;
CREATE POLICY teacher_create_authorizations ON public.authorizations
  FOR INSERT
  WITH CHECK (user_has_role('teacher', tenant_id) AND requested_by = auth.uid() AND tenant_id = get_user_tenant_id());
