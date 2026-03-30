-- Employees table
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  position TEXT,
  hire_date DATE,
  photo_url TEXT,
  blood_type TEXT CHECK (blood_type IN ('O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'Unknown')),
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  notes TEXT,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_employees_tenant ON public.employees(tenant_id);
CREATE INDEX idx_employees_user ON public.employees(user_id);
CREATE INDEX idx_employees_department ON public.employees(department_id);
CREATE INDEX idx_employees_archived ON public.employees(is_archived) WHERE is_archived = false;
CREATE INDEX idx_employees_name ON public.employees(last_name, first_name);
