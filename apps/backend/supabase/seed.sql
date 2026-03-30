-- Seed data for Nursery-SaaS

-- 3 Sample tenants
INSERT INTO public.tenants (name, slug, subdomain, theme_color, subscription_tier, max_children, max_employees)
VALUES
  ('Green Valley School', 'green-valley', 'green-valley', '#10b981', 'professional', 200, 50),
  ('Sunshine Nursery', 'sunshine', 'sunshine', '#f59e0b', 'starter', 100, 25),
  ('Rainbow Kids Academy', 'rainbow', 'rainbow', '#8b5cf6', 'professional', 300, 75);

-- Get tenant IDs for use in subsequent inserts
DO $$
DECLARE
  gv_tenant_id UUID;
  sun_tenant_id UUID;
  rb_tenant_id UUID;
  nurse_role_id UUID;
  admin_role_id UUID;
  teacher_role_id UUID;
  parent_role_id UUID;
BEGIN
  SELECT id INTO gv_tenant_id FROM public.tenants WHERE slug = 'green-valley';
  SELECT id INTO sun_tenant_id FROM public.tenants WHERE slug = 'sunshine';
  SELECT id INTO rb_tenant_id FROM public.tenants WHERE slug = 'rainbow';

  -- Get role IDs
  SELECT id INTO nurse_role_id FROM public.roles WHERE name = 'nurse' AND is_system = true;
  SELECT id INTO admin_role_id FROM public.roles WHERE name = 'school_admin' AND is_system = true;
  SELECT id INTO teacher_role_id FROM public.roles WHERE name = 'teacher' AND is_system = true;
  SELECT id INTO parent_role_id FROM public.roles WHERE name = 'parent' AND is_system = true;

  -- Create sample users (Note: These would normally be created via Auth service)
  -- We'll create placeholder user records
  INSERT INTO public.users (id, tenant_id, email, full_name, phone, is_active)
  VALUES
    ('550e8400-e29b-41d4-a716-446655440001'::UUID, gv_tenant_id, 'admin@greenvalley.com', 'Sarah Johnson', '+1234567890', true),
    ('550e8400-e29b-41d4-a716-446655440002'::UUID, gv_tenant_id, 'nurse@greenvalley.com', 'Maria Garcia', '+1234567891', true),
    ('550e8400-e29b-41d4-a716-446655440003'::UUID, gv_tenant_id, 'teacher@greenvalley.com', 'John Smith', '+1234567892', true),
    ('550e8400-e29b-41d4-a716-446655440004'::UUID, gv_tenant_id, 'parent@greenvalley.com', 'Emma Wilson', '+1234567893', true),
    ('550e8400-e29b-41d4-a716-446655440005'::UUID, sun_tenant_id, 'admin@sunshine.com', 'Robert Brown', '+1234567894', true);

  -- Assign roles to users
  INSERT INTO public.user_roles (user_id, role_id, tenant_id)
  VALUES
    ('550e8400-e29b-41d4-a716-446655440001'::UUID, admin_role_id, gv_tenant_id),
    ('550e8400-e29b-41d4-a716-446655440002'::UUID, nurse_role_id, gv_tenant_id),
    ('550e8400-e29b-41d4-a716-446655440003'::UUID, teacher_role_id, gv_tenant_id),
    ('550e8400-e29b-41d4-a716-446655440004'::UUID, parent_role_id, gv_tenant_id),
    ('550e8400-e29b-41d4-a716-446655440005'::UUID, admin_role_id, sun_tenant_id);

  -- Create sample classes
  INSERT INTO public.classes (tenant_id, name, grade_level, academic_year, teacher_id, capacity)
  VALUES
    (gv_tenant_id, 'Kindergarten A', 'K', '2024-2025', '550e8400-e29b-41d4-a716-446655440003'::UUID, 25),
    (gv_tenant_id, 'First Grade B', '1', '2024-2025', '550e8400-e29b-41d4-a716-446655440003'::UUID, 28);

  -- Create sample medications
  INSERT INTO public.medications (tenant_id, name, generic_name, dosage_form, default_dosage, requires_authorization)
  VALUES
    (gv_tenant_id, 'Ibuprofen', 'Ibuprofen', 'liquid', '5ml', true),
    (gv_tenant_id, 'Acetaminophen', 'Acetaminophen', 'tablet', '500mg', true),
    (gv_tenant_id, 'Epinephrine Auto-Injector', 'Epinephrine', 'injection', '0.3mg', true),
    (gv_tenant_id, 'Albuterol Inhaler', 'Albuterol', 'inhaler', '2 puffs', true);

  -- Create sample allergies
  INSERT INTO public.allergies (tenant_id, name, severity_level, description)
  VALUES
    (gv_tenant_id, 'Peanut', 'severe', 'Severe peanut allergy - anaphylaxis risk'),
    (gv_tenant_id, 'Penicillin', 'moderate', 'Antibiotic sensitivity'),
    (gv_tenant_id, 'Latex', 'moderate', 'Contact dermatitis'),
    (gv_tenant_id, 'Bee Sting', 'moderate', 'Allergic reaction to bee venom');

  -- Create sample children
  INSERT INTO public.children (tenant_id, first_name, last_name, date_of_birth, gender, class_id, blood_type, emergency_contact_name, emergency_contact_phone)
  VALUES
    (gv_tenant_id, 'Liam', 'Chen', '2019-05-15', 'M', (SELECT id FROM public.classes WHERE name = 'Kindergarten A' AND tenant_id = gv_tenant_id), 'O+', 'Michael Chen', '+1234567901'),
    (gv_tenant_id, 'Sophia', 'Martinez', '2019-08-22', 'F', (SELECT id FROM public.classes WHERE name = 'Kindergarten A' AND tenant_id = gv_tenant_id), 'A+', 'Carmen Martinez', '+1234567902'),
    (gv_tenant_id, 'Noah', 'Patel', '2018-03-10', 'M', (SELECT id FROM public.classes WHERE name = 'First Grade B' AND tenant_id = gv_tenant_id), 'B+', 'Rajesh Patel', '+1234567903');

  -- Link children to parents
  INSERT INTO public.child_parents (child_id, parent_user_id, relationship, is_primary_contact, consent_given)
  VALUES
    ((SELECT id FROM public.children WHERE first_name = 'Liam' AND tenant_id = gv_tenant_id), '550e8400-e29b-41d4-a716-446655440004'::UUID, 'parent', true, true);

  -- Add allergies to children
  INSERT INTO public.child_allergies (child_id, allergy_id, reaction_description, diagnosed_date)
  VALUES
    ((SELECT id FROM public.children WHERE first_name = 'Liam' AND tenant_id = gv_tenant_id),
     (SELECT id FROM public.allergies WHERE name = 'Peanut' AND tenant_id = gv_tenant_id),
     'Anaphylaxis', '2020-01-15'::DATE),
    ((SELECT id FROM public.children WHERE first_name = 'Sophia' AND tenant_id = gv_tenant_id),
     (SELECT id FROM public.allergies WHERE name = 'Penicillin' AND tenant_id = gv_tenant_id),
     'Rash and fever', '2019-06-10'::DATE);

  -- Add medications to children
  INSERT INTO public.child_medications (child_id, medication_id, dosage, frequency, start_date, prescribed_by)
  VALUES
    ((SELECT id FROM public.children WHERE first_name = 'Liam' AND tenant_id = gv_tenant_id),
     (SELECT id FROM public.medications WHERE name = 'Epinephrine Auto-Injector' AND tenant_id = gv_tenant_id),
     '0.3mg', 'as needed', '2020-01-20'::DATE, 'Dr. Smith'),
    ((SELECT id FROM public.children WHERE first_name = 'Noah' AND tenant_id = gv_tenant_id),
     (SELECT id FROM public.medications WHERE name = 'Albuterol Inhaler' AND tenant_id = gv_tenant_id),
     '2 puffs', 'twice daily', '2023-09-01'::DATE, 'Dr. Johnson');
END $$;
