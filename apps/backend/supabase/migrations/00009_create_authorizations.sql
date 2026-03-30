-- Authorizations table
CREATE TABLE public.authorizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  symptoms TEXT,
  notes TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent')),
  requested_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,
  responded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_authorizations_tenant ON public.authorizations(tenant_id);
CREATE INDEX idx_authorizations_child ON public.authorizations(child_id);
CREATE INDEX idx_authorizations_status ON public.authorizations(status);
CREATE INDEX idx_authorizations_requested_by ON public.authorizations(requested_by);
CREATE INDEX idx_authorizations_assigned_to ON public.authorizations(assigned_to);
CREATE INDEX idx_authorizations_priority ON public.authorizations(priority);
