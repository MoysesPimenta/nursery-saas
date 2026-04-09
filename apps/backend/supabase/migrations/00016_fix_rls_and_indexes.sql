-- Migration 00016: Fix RLS policy gaps and add performance indexes
-- Addresses: audit_logs INSERT policy, employee read tenant isolation, missing indexes

-- =====================================================
-- FIX 1: Audit logs INSERT policy — restrict to same tenant
-- =====================================================
DROP POLICY IF EXISTS "audit_logs_append_only" ON public.audit_logs;
CREATE POLICY "audit_logs_append_only" ON public.audit_logs
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM public.users WHERE id = get_user_id())
  );

-- =====================================================
-- FIX 2: Employee read own record — add tenant isolation
-- =====================================================
DROP POLICY IF EXISTS "employees_read_own_record" ON public.employees;
CREATE POLICY "employees_read_own_record" ON public.employees
  FOR SELECT USING (
    user_id = get_user_id() AND
    tenant_id IN (SELECT tenant_id FROM public.users WHERE id = get_user_id())
  );

-- =====================================================
-- FIX 3: Parent read child visits — add tenant isolation
-- =====================================================
DROP POLICY IF EXISTS "parent_read_child_visits" ON public.visits;
CREATE POLICY "parent_read_child_visits" ON public.visits
  FOR SELECT USING (
    child_id IN (
      SELECT child_id FROM public.child_parents WHERE parent_user_id = get_user_id()
    ) AND
    tenant_id IN (SELECT tenant_id FROM public.users WHERE id = get_user_id())
  );

-- =====================================================
-- ADD COMPOSITE INDEXES for common query patterns
-- =====================================================

-- Children: commonly filtered by tenant + archived status
CREATE INDEX IF NOT EXISTS idx_children_tenant_archived
  ON public.children(tenant_id, is_archived);

-- Visits: commonly fetched by tenant + creation date (recent first)
CREATE INDEX IF NOT EXISTS idx_visits_tenant_created
  ON public.visits(tenant_id, created_at DESC);

-- Authorizations: commonly filtered by tenant + status
CREATE INDEX IF NOT EXISTS idx_authorizations_tenant_status
  ON public.authorizations(tenant_id, status);

-- Allergies: commonly filtered by tenant
CREATE INDEX IF NOT EXISTS idx_allergies_tenant
  ON public.allergies(tenant_id);

-- Employees: commonly filtered by tenant + archived status
CREATE INDEX IF NOT EXISTS idx_employees_tenant_archived
  ON public.employees(tenant_id, is_archived);

-- Audit logs: commonly filtered by tenant + timestamp
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_timestamp
  ON public.audit_logs(tenant_id, created_at DESC);

-- User roles: commonly looked up by user_id + tenant_id
CREATE INDEX IF NOT EXISTS idx_user_roles_user_tenant
  ON public.user_roles(user_id, tenant_id);
