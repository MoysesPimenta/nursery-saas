ALTER TABLE public.child_medications ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE public.child_medications ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false;
ALTER TABLE public.child_medications ADD COLUMN IF NOT EXISTS prescription_document_url TEXT;
