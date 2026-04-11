-- Fix RLS policies on employee_allergies and employee_medications tables
-- Allow nurse, super_admin, and school_admin roles

-- Drop old restrictive policies if they exist
DROP POLICY IF EXISTS nurse_manage_employee_allergies ON public.employee_allergies;
DROP POLICY IF EXISTS nurse_manage_employee_medications ON public.employee_medications;

-- Create new policies that allow nurse, super_admin, and school_admin
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
