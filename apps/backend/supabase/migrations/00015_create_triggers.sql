-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_children_updated_at BEFORE UPDATE ON public.children
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_authorizations_updated_at BEFORE UPDATE ON public.authorizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON public.visits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_custom_field_values_updated_at BEFORE UPDATE ON public.custom_field_values
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Audit log trigger function
CREATE OR REPLACE FUNCTION public.audit_log_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
BEGIN
  -- Determine tenant_id based on entity type
  CASE TG_TABLE_NAME
    WHEN 'children' THEN v_tenant_id := NEW.tenant_id;
    WHEN 'employees' THEN v_tenant_id := NEW.tenant_id;
    WHEN 'visits' THEN v_tenant_id := NEW.tenant_id;
    WHEN 'authorizations' THEN v_tenant_id := NEW.tenant_id;
    WHEN 'medications' THEN v_tenant_id := NEW.tenant_id;
    WHEN 'allergies' THEN v_tenant_id := NEW.tenant_id;
    WHEN 'child_medications' THEN
      v_tenant_id := (SELECT tenant_id FROM public.children WHERE id = NEW.child_id);
    WHEN 'child_allergies' THEN
      v_tenant_id := (SELECT tenant_id FROM public.children WHERE id = NEW.child_id);
    WHEN 'employee_medications' THEN
      v_tenant_id := (SELECT tenant_id FROM public.employees WHERE id = NEW.employee_id);
    WHEN 'employee_allergies' THEN
      v_tenant_id := (SELECT tenant_id FROM public.employees WHERE id = NEW.employee_id);
    ELSE
      RETURN NEW;
  END CASE;

  v_user_id := auth.uid();

  -- Insert audit log entry
  INSERT INTO public.audit_logs (
    tenant_id,
    user_id,
    action,
    entity_type,
    entity_id,
    before_data,
    after_data,
    ip_address,
    user_agent
  ) VALUES (
    v_tenant_id,
    v_user_id,
    CASE TG_OP
      WHEN 'INSERT' THEN 'CREATE'
      WHEN 'UPDATE' THEN 'UPDATE'
      WHEN 'DELETE' THEN 'DELETE'
    END,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE TG_OP WHEN 'DELETE' THEN row_to_json(OLD) WHEN 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
    CASE TG_OP WHEN 'INSERT' THEN row_to_json(NEW) WHEN 'UPDATE' THEN row_to_json(NEW) ELSE NULL END,
    current_setting('request.headers', true)::jsonb ->> 'x-forwarded-for',
    current_setting('request.headers', true)::jsonb ->> 'user-agent'
  );

  RETURN CASE TG_OP WHEN 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit log trigger to key tables
CREATE TRIGGER audit_children AFTER INSERT OR UPDATE OR DELETE ON public.children
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER audit_employees AFTER INSERT OR UPDATE OR DELETE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER audit_visits AFTER INSERT OR UPDATE OR DELETE ON public.visits
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER audit_authorizations AFTER INSERT OR UPDATE OR DELETE ON public.authorizations
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER audit_medications AFTER INSERT OR UPDATE OR DELETE ON public.medications
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER audit_allergies AFTER INSERT OR UPDATE OR DELETE ON public.allergies
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER audit_child_medications AFTER INSERT OR UPDATE OR DELETE ON public.child_medications
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER audit_child_allergies AFTER INSERT OR UPDATE OR DELETE ON public.child_allergies
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER audit_employee_medications AFTER INSERT OR UPDATE OR DELETE ON public.employee_medications
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER audit_employee_allergies AFTER INSERT OR UPDATE OR DELETE ON public.employee_allergies
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
