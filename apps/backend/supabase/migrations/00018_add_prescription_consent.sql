-- Add prescription consent tracking to child_medications
ALTER TABLE public.child_medications
ADD COLUMN IF NOT EXISTS consent_status TEXT DEFAULT 'pending' CHECK (consent_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE public.child_medications
ADD COLUMN IF NOT EXISTS consent_date TIMESTAMPTZ;

ALTER TABLE public.child_medications
ADD COLUMN IF NOT EXISTS consented_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_child_medications_consent_status ON public.child_medications(consent_status);
