-- Medications catalog table
CREATE TABLE public.medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  generic_name TEXT,
  dosage_form TEXT CHECK (dosage_form IN ('tablet', 'liquid', 'injection', 'topical', 'inhaler', 'other')),
  default_dosage TEXT,
  instructions TEXT,
  requires_authorization BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_medications_tenant ON public.medications(tenant_id);
CREATE INDEX idx_medications_active ON public.medications(is_active) WHERE is_active = true;

-- Allergies catalog table
CREATE TABLE public.allergies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  severity_level TEXT CHECK (severity_level IN ('mild', 'moderate', 'severe', 'life_threatening')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_allergies_tenant ON public.allergies(tenant_id);
CREATE INDEX idx_allergies_severity ON public.allergies(severity_level);

-- Child medications table
CREATE TABLE public.child_medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  dosage TEXT NOT NULL,
  frequency TEXT,
  start_date DATE,
  end_date DATE,
  prescribed_by TEXT,
  authorization_document_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(child_id, medication_id, start_date)
);

CREATE INDEX idx_child_medications_child ON public.child_medications(child_id);
CREATE INDEX idx_child_medications_medication ON public.child_medications(medication_id);

-- Child allergies table
CREATE TABLE public.child_allergies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  allergy_id UUID NOT NULL REFERENCES public.allergies(id) ON DELETE CASCADE,
  reaction_description TEXT,
  diagnosed_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(child_id, allergy_id)
);

CREATE INDEX idx_child_allergies_child ON public.child_allergies(child_id);
CREATE INDEX idx_child_allergies_allergy ON public.child_allergies(allergy_id);

-- Employee medications table
CREATE TABLE public.employee_medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  dosage TEXT NOT NULL,
  frequency TEXT,
  start_date DATE,
  end_date DATE,
  prescribed_by TEXT,
  authorization_document_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, medication_id, start_date)
);

CREATE INDEX idx_employee_medications_employee ON public.employee_medications(employee_id);
CREATE INDEX idx_employee_medications_medication ON public.employee_medications(medication_id);

-- Employee allergies table
CREATE TABLE public.employee_allergies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  allergy_id UUID NOT NULL REFERENCES public.allergies(id) ON DELETE CASCADE,
  reaction_description TEXT,
  diagnosed_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, allergy_id)
);

CREATE INDEX idx_employee_allergies_employee ON public.employee_allergies(employee_id);
CREATE INDEX idx_employee_allergies_allergy ON public.employee_allergies(allergy_id);
