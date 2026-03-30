-- Children table
CREATE TABLE public.children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('M', 'F', 'O', 'Prefer not to say')),
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  photo_url TEXT,
  blood_type TEXT CHECK (blood_type IN ('O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'Unknown')),
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relation TEXT,
  notes TEXT,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_children_tenant ON public.children(tenant_id);
CREATE INDEX idx_children_class ON public.children(class_id);
CREATE INDEX idx_children_archived ON public.children(is_archived) WHERE is_archived = false;
CREATE INDEX idx_children_name ON public.children(last_name, first_name);

-- Child-Parents junction table
CREATE TABLE public.child_parents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  parent_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  relationship TEXT,
  is_primary_contact BOOLEAN DEFAULT false,
  consent_given BOOLEAN DEFAULT false,
  consent_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(child_id, parent_user_id)
);

CREATE INDEX idx_child_parents_child ON public.child_parents(child_id);
CREATE INDEX idx_child_parents_parent ON public.child_parents(parent_user_id);
