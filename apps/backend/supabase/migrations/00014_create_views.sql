-- Visit counts view
CREATE OR REPLACE VIEW public.v_visit_counts AS
SELECT
  v.tenant_id,
  DATE(v.created_at) as visit_date,
  v.visit_type,
  COUNT(*) as count
FROM public.visits v
GROUP BY v.tenant_id, DATE(v.created_at), v.visit_type;

-- Medication errors tracking view
CREATE OR REPLACE VIEW public.v_medication_errors AS
SELECT
  v.id as visit_id,
  v.child_id,
  v.tenant_id,
  v.created_at,
  jsonb_array_elements(v.medications_administered) as medication,
  NULL::TEXT as error_type,
  NULL::TEXT as notes
FROM public.visits v
WHERE v.medications_administered IS NOT NULL;

-- Allergy alerts view - children with severe/life_threatening allergies
CREATE OR REPLACE VIEW public.v_allergy_alerts AS
SELECT
  c.id as child_id,
  c.tenant_id,
  c.first_name,
  c.last_name,
  c.class_id,
  a.name as allergy_name,
  a.severity_level,
  ca.reaction_description,
  ca.diagnosed_date,
  ca.notes
FROM public.children c
JOIN public.child_allergies ca ON c.id = ca.child_id
JOIN public.allergies a ON ca.allergy_id = a.id
WHERE a.severity_level IN ('severe', 'life_threatening')
AND c.is_archived = false
ORDER BY c.last_name, c.first_name, a.severity_level;
