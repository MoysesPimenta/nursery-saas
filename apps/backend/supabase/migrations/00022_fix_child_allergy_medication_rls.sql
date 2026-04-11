-- Fix RLS policies on child_allergies and child_medications tables
-- Previously only allowed 'nurse' role, now allows nurse, super_admin, and school_admin

-- Drop old restrictive policies
DROP POLICY IF EXISTS nurse_manage_child_allergies ON public.child_allergies;
DROP POLICY IF EXISTS nurse_manage_child_medications ON public.child_medications;

-- Create new policies that allow nurse, super_admin, and school_admin
CREATE POLICY staff_manage_child_allergies ON public.child_allergies
  FOR ALL
  USING (
    user_has_role('nurse', get_child_tenant_id(child_id))
    OR user_has_role('super_admin', get_child_tenant_id(child_id))
    OR user_has_role('school_admin', get_child_tenant_id(child_id))
  )
  WITH CHECK (
    user_has_role('nurse', get_child_tenant_id(child_id))
    OR user_has_role('super_admin', get_child_tenant_id(child_id))
    OR user_has_role('school_admin', get_child_tenant_id(child_id))
  );

CREATE POLICY staff_manage_child_medications ON public.child_medications
  FOR ALL
  USING (
    user_has_role('nurse', get_child_tenant_id(child_id))
    OR user_has_role('super_admin', get_child_tenant_id(child_id))
    OR user_has_role('school_admin', get_child_tenant_id(child_id))
  )
  WITH CHECK (
    user_has_role('nurse', get_child_tenant_id(child_id))
    OR user_has_role('super_admin', get_child_tenant_id(child_id))
    OR user_has_role('school_admin', get_child_tenant_id(child_id))
  );
