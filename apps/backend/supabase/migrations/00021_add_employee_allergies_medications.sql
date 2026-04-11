-- Employee allergies junction table (mirrors child_allergies)
CREATE TABLE IF NOT EXISTS public.employee_allergies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  allergy_id UUID NOT NULL REFERENCES public.allergies(id) ON DELETE CASCADE,
  reaction_description TEXT,
  diagnosed_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, allergy_id)
);

-- Employee medications junction table (mirrors child_medications)
CREATE TABLE IF NOT EXISTS public.employee_medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  dosage TEXT NOT NULL,
  frequency TEXT,
  start_date DATE,
  end_date DATE,
  prescribed_by TEXT,
  notes TEXT,
  due_date DATE,
  prescription_document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, medication_id, start_date)
);

CREATE INDEX IF NOT EXISTS idx_employee_allergies_employee ON public.employee_allergies(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_allergies_allergy ON public.employee_allergies(allergy_id);
CREATE INDEX IF NOT EXISTS idx_employee_medications_employee ON public.employee_medications(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_medications_medication ON public.employee_medications(medication_id);

ALTER TABLE public.employee_allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_medications ENABLE ROW LEVEL SECURITY;
