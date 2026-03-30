-- Tenants table: each school is a tenant
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  subdomain TEXT UNIQUE,
  logo_url TEXT,
  theme_color TEXT DEFAULT '#22c55e',
  favicon_url TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'professional', 'enterprise')),
  max_children INTEGER DEFAULT 50,
  max_employees INTEGER DEFAULT 20,
  max_storage_mb INTEGER DEFAULT 500,
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tenants_slug ON public.tenants(slug);
CREATE INDEX idx_tenants_active ON public.tenants(is_active) WHERE is_active = true;
