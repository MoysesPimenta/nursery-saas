-- Migration 00024: Create missing get_employee_tenant_id function and fix employee RLS policies
-- CRITICAL FIX: Migration 00023 references get_employee_tenant_id() but it was never created.
-- This function is essential for preventing infinite RLS recursion on employee_allergies and
-- employee_medications tables (same pattern as get_child_tenant_id in migration 00017).

-- 1. Create SECURITY DEFINER function to get tenant_id from an employee (bypasses RLS)
-- This prevents infinite recursion when employee_allergies and employee_medications policies
-- need to look up the employee's tenant_id for role checks.
CREATE OR REPLACE FUNCTION public.get_employee_tenant_id(p_employee_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT tenant_id FROM public.employees WHERE id = p_employee_id;
$$;

-- 2. Drop and recreate employee_allergies RLS policy
-- This policy now uses get_employee_tenant_id() instead of failing with "function not found"
DROP POLICY IF EXISTS staff_manage_employee_allergies ON public.employee_allergies;
CREATE POLICY staff_manage_employee_allergies ON public.employee_allergies
  FOR ALL
  USING (
    user_has_role('nurse', get_employee_tenant_id(employee_id))
    OR user_has_role('super_admin', get_employee_tenant_id(employee_id))
    OR user_has_role('school_admin', get_employee_tenant_id(employee_id))
  )
  WITH CHECK (
    user_has_role('nurse', get_employee_tenant_id(employee_id))
    OR user_has_role('super_admin', get_employee_tenant_id(employee_id))
    OR user_has_role('school_admin', get_employee_tenant_id(employee_id))
  );

-- 3. Drop and recreate employee_medications RLS policy
-- This policy now uses get_employee_tenant_id() instead of failing with "function not found"
DROP POLICY IF EXISTS staff_manage_employee_medications ON public.employee_medications;
CREATE POLICY staff_manage_employee_medications ON public.employee_medications
  FOR ALL
  USING (
    user_has_role('nurse', get_employee_tenant_id(employee_id))
    OR user_has_role('super_admin', get_employee_tenant_id(employee_id))
    OR user_has_role('school_admin', get_employee_tenant_id(employee_id))
  )
  WITH CHECK (
    user_has_role('nurse', get_employee_tenant_id(employee_id))
    OR user_has_role('super_admin', get_employee_tenant_id(employee_id))
    OR user_has_role('school_admin', get_employee_tenant_id(employee_id))
  );

-- 4. Add performance indexes on time-based columns
-- These improve query performance for date-range filtering and sorting
CREATE INDEX IF NOT EXISTS idx_visits_started_at ON public.visits(started_at);
CREATE INDEX IF NOT EXISTS idx_visits_ended_at ON public.visits(ended_at);
CREATE INDEX IF NOT EXISTS idx_child_medications_start_date ON public.child_medications(start_date);
CREATE INDEX IF NOT EXISTS idx_child_medications_end_date ON public.child_medications(end_date);
CREATE INDEX IF NOT EXISTS idx_employee_medications_start_date ON public.employee_medications(start_date);
CREATE INDEX IF NOT EXISTS idx_employee_medications_end_date ON public.employee_medications(end_date);

-- 5. Add CHECK constraints to enforce data integrity
-- Prevents invalid date ranges and negative values
ALTER TABLE public.child_medications ADD CONSTRAINT chk_child_medication_dates
  CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date);

ALTER TABLE public.employee_medications ADD CONSTRAINT chk_employee_medication_dates
  CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date);

ALTER TABLE public.visits ADD CONSTRAINT chk_visit_dates
  CHECK (ended_at IS NULL OR started_at <= ended_at);

ALTER TABLE public.classes ADD CONSTRAINT chk_class_capacity
  CHECK (capacity IS NULL OR capacity >= 0);

ALTER TABLE public.tenants ADD CONSTRAINT chk_tenant_limits
  CHECK (max_children >= 0 AND max_employees >= 0 AND max_storage_mb >= 0);
