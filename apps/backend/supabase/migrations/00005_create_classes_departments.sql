-- Classes table
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  grade_level TEXT,
  academic_year TEXT,
  teacher_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  capacity INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, name, academic_year)
);

CREATE INDEX idx_classes_tenant ON public.classes(tenant_id);
CREATE INDEX idx_classes_teacher ON public.classes(teacher_id);

-- Departments table
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  head_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_departments_tenant ON public.departments(tenant_id);
CREATE INDEX idx_departments_head ON public.departments(head_id);
