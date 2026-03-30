-- Visits table
CREATE TABLE public.visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  child_id UUID REFERENCES public.children(id) ON DELETE SET NULL,
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  authorization_id UUID REFERENCES public.authorizations(id) ON DELETE SET NULL,
  nurse_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  visit_type TEXT NOT NULL CHECK (visit_type IN ('authorization', 'walk_in', 'scheduled', 'emergency')),
  chief_complaint TEXT,
  vitals JSONB,
  assessment TEXT,
  treatment TEXT,
  medications_administered JSONB,
  attachments JSONB,
  disposition TEXT CHECK (disposition IN ('returned_to_class', 'sent_home', 'referred', 'hospitalized', 'other')),
  parent_notified BOOLEAN DEFAULT false,
  parent_notified_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_visits_tenant ON public.visits(tenant_id);
CREATE INDEX idx_visits_child ON public.visits(child_id);
CREATE INDEX idx_visits_employee ON public.visits(employee_id);
CREATE INDEX idx_visits_authorization ON public.visits(authorization_id);
CREATE INDEX idx_visits_nurse ON public.visits(nurse_id);
CREATE INDEX idx_visits_type ON public.visits(visit_type);
CREATE INDEX idx_visits_created_at ON public.visits(created_at);
