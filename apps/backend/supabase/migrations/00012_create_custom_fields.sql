-- Custom fields table
CREATE TABLE public.custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('child', 'employee', 'visit')),
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'boolean', 'date', 'select', 'multiselect')),
  field_options JSONB,
  is_required BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, entity_type, field_name)
);

CREATE INDEX idx_custom_fields_tenant ON public.custom_fields(tenant_id);
CREATE INDEX idx_custom_fields_entity_type ON public.custom_fields(entity_type);

-- Custom field values table
CREATE TABLE public.custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_field_id UUID NOT NULL REFERENCES public.custom_fields(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL,
  value JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(custom_field_id, entity_id)
);

CREATE INDEX idx_custom_field_values_field ON public.custom_field_values(custom_field_id);
CREATE INDEX idx_custom_field_values_entity ON public.custom_field_values(entity_id);
