BEGIN;
SELECT plan(58);

-- Synthetic local fixtures only. The transaction rolls back at the end.
INSERT INTO public.categories (
  slug, icon_name, name_es_ar, name_pt_br, description_es_ar, description_pt_br,
  examples_es_ar, examples_pt_br, display_order, is_active
) VALUES (
  'hogar', 'home', 'Hogar', 'Casa e Reparos', 'Servicios del hogar', 'Serviços residenciais',
  ARRAY['Electricidad'], ARRAY['Elétrica'], 1, true
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'l1-client@example.invalid', '', '{"provider":"email","providers":["email"]}', '{"role":"client","full_name":"Lote Um Cliente","phone":"+550000000001"}', now(), now()),
  ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000000', 'authenticated', 'authenticated', 'l1-pro@example.invalid', '', '{"provider":"email","providers":["email"]}', '{"role":"professional","full_name":"Lote Um Prestador","phone":"+550000000002","category_slug":"hogar"}', now(), now()),
  ('10000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'l1-draft@example.invalid', '', '{"provider":"email","providers":["email"]}', '{"role":"professional","full_name":"Prestador Rascunho","phone":"+550000000003","category_slug":"hogar"}', now(), now()),
  ('10000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'l1-admin@example.invalid', '', '{"provider":"email","providers":["email"]}', '{"role":"client","full_name":"Lote Um Admin"}', now(), now()),
  ('10000000-0000-4000-8000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'l1-suspended@example.invalid', '', '{"provider":"email","providers":["email"]}', '{"role":"client","full_name":"Cliente Suspenso"}', now(), now()),
  ('10000000-0000-4000-8000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'l1-no-contact@example.invalid', '', '{"provider":"email","providers":["email"]}', '{"role":"professional","full_name":"Prestador Sem Contato","category_slug":"hogar"}', now(), now()),
  ('10000000-0000-4000-8000-000000000007', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'l1-suspended-pro@example.invalid', '', '{"provider":"email","providers":["email"]}', '{"role":"professional","full_name":"Prestador Suspenso","category_slug":"hogar"}', now(), now()),
  ('10000000-0000-4000-8000-000000000008', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'l1-verification-request@example.invalid', '', '{"provider":"email","providers":["email"]}', '{"role":"professional","full_name":"Prestador Solicita Verificação","phone":"+550000000008","category_slug":"hogar"}', now(), now());

INSERT INTO public.admin_memberships (user_id)
VALUES ('10000000-0000-4000-8000-000000000004');
SET LOCAL "request.jwt.claim.sub" = '10000000-0000-4000-8000-000000000004';
UPDATE public.professional_profiles
SET status = 'published', verification_status = 'verified', matricula_note = 'synthetic verification note'
WHERE user_id = '10000000-0000-4000-8000-000000000002';
UPDATE public.professional_profiles
SET matricula_note = 'draft note', verification_status = 'pending'
WHERE user_id = '10000000-0000-4000-8000-000000000003';
UPDATE public.professional_profiles
SET status = 'published', verification_status = 'verified', accepts_direct_contact = false, accepts_quote_requests = false
WHERE user_id = '10000000-0000-4000-8000-000000000006';
UPDATE public.professional_profiles
SET status = 'published', verification_status = 'verified'
WHERE user_id = '10000000-0000-4000-8000-000000000007';
UPDATE public.professional_profiles
SET matricula_note = 'synthetic verification note'
WHERE user_id = '10000000-0000-4000-8000-000000000008';
UPDATE public.profiles
SET is_suspended = true
WHERE id IN ('10000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000007');

SELECT is(has_column_privilege('anon', 'public.profiles', 'phone', 'SELECT'), false,
  'anon cannot read profiles.phone directly');
SELECT is(has_column_privilege('authenticated', 'public.profiles', 'phone', 'SELECT'), false,
  'authenticated cannot read profiles.phone directly');
SELECT is(has_column_privilege('anon', 'public.professional_profiles', 'matricula_note', 'SELECT'), false,
  'anon cannot read professional_profiles.matricula_note directly');
SELECT is(has_column_privilege('authenticated', 'public.professional_profiles', 'matricula_note', 'SELECT'), false,
  'authenticated cannot read professional_profiles.matricula_note directly');
SELECT ok(has_function_privilege('authenticated', 'public.get_own_phone()', 'EXECUTE'),
  'authenticated can use the own-phone RPC');
SELECT ok(has_function_privilege('authenticated', 'public.get_own_verification_note()', 'EXECUTE'),
  'authenticated can use the own-verification-note RPC');
SELECT ok(has_function_privilege('authenticated', 'public.admin_list_pending_verifications()', 'EXECUTE'),
  'authenticated can call the admin queue RPC, which must enforce admin authorization internally');
SELECT ok(NOT has_function_privilege('anon', 'public.get_own_phone()', 'EXECUTE'),
  'anon cannot execute the own-phone RPC');
SELECT ok(NOT has_function_privilege('anon', 'public.admin_list_pending_verifications()', 'EXECUTE'),
  'anon cannot execute the admin queue RPC');
SELECT ok(EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_protect_profile_sensitive_fields' AND NOT tgisinternal),
  'profiles has a sensitive-field protection trigger');
SELECT ok(EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_protect_pro_profile_sensitive_fields' AND NOT tgisinternal),
  'professional_profiles has a sensitive-field protection trigger');
SELECT is(has_table_privilege('authenticated', 'public.professional_profiles', 'INSERT'), false,
  'authenticated cannot insert professional profiles directly');
SELECT is(has_table_privilege('authenticated', 'public.professional_profiles', 'UPDATE'), false,
  'authenticated cannot update professional profiles directly');
SELECT ok(has_function_privilege('authenticated', 'public.save_own_professional_profile(jsonb)', 'EXECUTE'),
  'authenticated can save a professional profile through the guarded RPC');
SELECT ok(has_function_privilege('authenticated', 'public.switch_own_account_to_client()', 'EXECUTE'),
  'authenticated can request a guarded switch to client');
SELECT ok(NOT has_function_privilege('anon', 'public.save_own_professional_profile(jsonb)', 'EXECUTE'),
  'anon cannot execute save_own_professional_profile');
SELECT ok(NOT has_function_privilege('anon', 'public.switch_own_account_to_client()', 'EXECUTE'),
  'anon cannot execute switch_own_account_to_client');
SELECT ok(NOT has_function_privilege('anon', 'public.request_professional_verification(text)', 'EXECUTE'),
  'anon cannot execute request_professional_verification');
SELECT ok(NOT has_function_privilege('anon', 'public.admin_decide_professional_verification(uuid,public.verification_status,text)', 'EXECUTE'),
  'anon cannot execute admin_decide_professional_verification');
SELECT ok(NOT has_function_privilege('anon', 'public.start_or_get_conversation(uuid,text,public.quote_status,text)', 'EXECUTE'),
  'anon cannot execute start_or_get_conversation');
SELECT ok(
  pg_get_functiondef('public.start_or_get_conversation(uuid,text,public.quote_status,text)'::regprocedure)
    LIKE '%pg_advisory_xact_lock%',
  'conversation creation uses a transaction lock scoped to the participant pair'
);

SET LOCAL ROLE anon;
SELECT throws_ok(
  $$SELECT phone FROM public.profiles WHERE id = '10000000-0000-4000-8000-000000000001'$$,
  '42501', 'permission denied for table profiles',
  'anonymous SQL cannot read a profile phone'
);
SELECT throws_ok(
  $$SELECT matricula_note FROM public.professional_profiles WHERE user_id = '10000000-0000-4000-8000-000000000002'$$,
  '42501', 'permission denied for table professional_profiles',
  'anonymous SQL cannot read a verification note'
);

RESET ROLE;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '10000000-0000-4000-8000-000000000001';
SELECT is(public.get_own_phone(), '+550000000001', 'own-phone RPC returns only the caller phone');
SELECT throws_ok(
  $$UPDATE public.profiles SET role = 'admin' WHERE id = '10000000-0000-4000-8000-000000000001'$$,
  '42501', 'Only an administrator can grant the admin role.',
  'profile trigger prevents self-promotion to admin'
);
SELECT throws_ok(
  $$UPDATE public.profiles SET is_suspended = true WHERE id = '10000000-0000-4000-8000-000000000001'$$,
  '42501', 'Only an administrator can change suspension status.',
  'profile trigger prevents self-suspension changes'
);
SELECT throws_ok(
  $$SELECT public.admin_list_pending_verifications()$$,
  '42501', 'Acesso negado.',
  'admin verification queue rejects a non-admin caller'
);
SELECT throws_ok(
  $$SELECT public.start_or_get_conversation('10000000-0000-4000-8000-000000000003', 'Teste', 'direct_chat', null)$$,
  '42501', 'This professional is not available for contact.',
  'conversation RPC rejects an unpublished professional'
);
SELECT throws_ok(
  $$SELECT public.start_or_get_conversation('10000000-0000-4000-8000-000000000001', 'Teste', 'direct_chat', null)$$,
  '22023', 'Choose another professional to contact.',
  'conversation RPC rejects self as recipient'
);
SELECT throws_ok(
  $$SELECT public.start_or_get_conversation('10000000-0000-4000-8000-000000000004', 'Teste', 'direct_chat', null)$$,
  '42501', 'This professional is not available for contact.',
  'conversation RPC rejects a recipient who is not a published professional'
);
SELECT throws_ok(
  $$SELECT public.start_or_get_conversation('10000000-0000-4000-8000-000000000006', 'Teste', 'direct_chat', null)$$,
  '42501', 'This professional is not available for contact.',
  'conversation RPC enforces the professional direct-contact preference'
);
SET LOCAL "request.jwt.claim.sub" = '10000000-0000-4000-8000-000000000001';
SELECT throws_ok(
  $$SELECT public.start_or_get_conversation('10000000-0000-4000-8000-000000000006', 'Teste', 'quote_requested', null)$$,
  '42501', 'This professional is not available for contact.',
  'conversation RPC enforces the professional quote-request preference'
);
SELECT throws_ok(
  $$SELECT public.start_or_get_conversation('10000000-0000-4000-8000-000000000007', 'Teste', 'direct_chat', null)$$,
  '42501', 'This professional is not available for contact.',
  'conversation RPC rejects a suspended recipient'
);
SELECT throws_ok(
  $$SELECT public.start_or_get_conversation('10000000-0000-4000-8000-000000000002', 'Teste', 'accepted', null)$$,
  '22023', 'A conversation must start as direct chat or quote request.',
  'conversation RPC rejects advanced statuses as initial state'
);
SET LOCAL "request.jwt.claim.sub" = '10000000-0000-4000-8000-000000000001';
SELECT lives_ok(
  $$SELECT public.start_or_get_conversation('10000000-0000-4000-8000-000000000002', 'Consulta teste', 'quote_requested', 'Mensagem sintética')$$,
  'client can create a quote request with a published professional'
);
SELECT is(
  (SELECT count(*)::integer FROM public.conversations c JOIN public.conversation_participants cp ON cp.conversation_id = c.id WHERE cp.user_id = '10000000-0000-4000-8000-000000000001'),
  1,
  'valid quote request creates one conversation for the client'
);
SELECT is(
  public.start_or_get_conversation('10000000-0000-4000-8000-000000000002', 'Consulta teste', 'quote_requested', null),
  (SELECT c.id FROM public.conversations c JOIN public.conversation_participants cp ON cp.conversation_id = c.id
   WHERE cp.user_id = '10000000-0000-4000-8000-000000000001' ORDER BY c.created_at LIMIT 1),
  'repeated quote request reuses the existing open conversation'
);
DO $$
BEGIN
  PERFORM public.start_or_get_conversation(
    '10000000-0000-4000-8000-000000000002', 'Consulta teste', 'direct_chat', null
  );
END;
$$;
SELECT is(
  (SELECT c.quote_status FROM public.conversations c JOIN public.conversation_participants cp ON cp.conversation_id = c.id
   WHERE cp.user_id = '10000000-0000-4000-8000-000000000001' ORDER BY c.created_at LIMIT 1),
  'quote_requested'::public.quote_status,
  'direct-start retry does not downgrade an existing quote request'
);
SET LOCAL "request.jwt.claim.sub" = '10000000-0000-4000-8000-000000000005';
SELECT throws_ok(
  $$SELECT public.start_or_get_conversation('10000000-0000-4000-8000-000000000002', 'Teste', 'direct_chat', null)$$,
  '42501', 'This account cannot start conversations.',
  'suspended caller cannot start a conversation'
);
SET LOCAL "request.jwt.claim.sub" = '10000000-0000-4000-8000-000000000004';
SELECT ok(
  EXISTS (SELECT 1 FROM public.admin_list_pending_verifications() q WHERE q.user_id = '10000000-0000-4000-8000-000000000003'),
  'authorized administrator can read the pending verification queue'
);
SET LOCAL "request.jwt.claim.sub" = '10000000-0000-4000-8000-000000000002';
SELECT is(public.get_own_verification_note(), 'synthetic verification note',
  'verification-note RPC returns only the caller note');
SET LOCAL "request.jwt.claim.sub" = '10000000-0000-4000-8000-000000000008';
SELECT throws_ok(
  $$UPDATE public.professional_profiles SET verification_status = 'verified' WHERE user_id = '10000000-0000-4000-8000-000000000008'$$,
  '42501', 'permission denied for table professional_profiles',
  'professional cannot self-verify through direct table access'
);
SELECT throws_ok(
  $$SELECT public.start_or_get_conversation('10000000-0000-4000-8000-000000000001', 'Cotización', 'quote_requested', null)$$,
  '42501', 'Only client accounts can request a quote.',
  'professional account cannot create a quote request'
);

-- Additional Lote 3 regression assertions (the original 34 assertions stay intact).
-- A verification request must be possible through the guarded RPC even though
-- direct edits of the verification state and note are forbidden.
SET LOCAL "request.jwt.claim.sub" = '10000000-0000-4000-8000-000000000008';
SELECT lives_ok(
  $$SELECT public.request_professional_verification('synthetic license document')$$,
  'professional can submit verification through the request RPC'
);
SELECT throws_ok(
  $$UPDATE public.professional_profiles SET matricula_note = 'forged note' WHERE user_id = '10000000-0000-4000-8000-000000000008'$$,
  '42501', 'permission denied for table professional_profiles',
  'professional cannot directly alter the verification note'
);

-- A profile pending review cannot be published by the owner.
SET LOCAL "request.jwt.claim.sub" = '10000000-0000-4000-8000-000000000003';
SELECT throws_ok(
  $$SELECT public.save_own_professional_profile('{"full_name":"Prestador Rascunho","country":"BR","city":"São Paulo","avatar_url":null,"slug":"prestador-pendente","category_slug":"hogar","primary_specialty_es_ar":"Instalação elétrica","primary_specialty_pt_br":"Instalação elétrica","secondary_specialties":[],"bio":"Atendimento residencial com experiência.","years_of_experience":3,"neighborhood":"Centro","coverage_zones":["Centro"],"languages":["Português"],"schedule_summary":"Segunda a sexta","accepts_direct_contact":true,"accepts_quote_requests":true,"reference_starting_price":null,"status":"published"}'::jsonb)$$,
  '42501', 'Professional verification is required before publication.',
  'pending professional cannot publish through the guarded save RPC'
);

-- A suspended account cannot publish through the owner RPC.
SET LOCAL "request.jwt.claim.sub" = '10000000-0000-4000-8000-000000000007';
SELECT throws_ok(
  $$SELECT public.save_own_professional_profile('{}'::jsonb)$$,
  '42501', 'This account cannot create or edit a professional profile.',
  'suspended professional cannot publish or edit through the owner RPC'
);

-- Role transitions must use an explicit, guarded business workflow.
SET LOCAL "request.jwt.claim.sub" = '10000000-0000-4000-8000-000000000001';
SELECT throws_ok(
  $$UPDATE public.profiles SET role = 'professional' WHERE id = '10000000-0000-4000-8000-000000000001'$$,
  '42501', 'Use the approved account-role workflow to change your role.',
  'client cannot directly promote their own account to professional'
);
SET LOCAL "request.jwt.claim.sub" = '10000000-0000-4000-8000-000000000005';
SELECT throws_ok(
  $$UPDATE public.profiles SET role = 'professional' WHERE id = '10000000-0000-4000-8000-000000000005'$$,
  '42501', 'Use the approved account-role workflow to change your role.',
  'suspended client cannot change their account role'
);

SET LOCAL "request.jwt.claim.sub" = '10000000-0000-4000-8000-000000000004';
SELECT lives_ok(
  $$SELECT public.admin_decide_professional_verification('10000000-0000-4000-8000-000000000003', 'verified', 'synthetic review approved')$$,
  'authorized administrator can approve professional verification'
);
SELECT is(
  (SELECT verification_status::text FROM public.professional_profiles WHERE user_id = '10000000-0000-4000-8000-000000000003'),
  'verified',
  'admin approval persists verified state'
);

SET LOCAL "request.jwt.claim.sub" = '10000000-0000-4000-8000-000000000001';
SELECT lives_ok(
  $$SELECT public.save_own_professional_profile('{"full_name":"Lote Um Cliente","country":"BR","city":"São Paulo","avatar_url":null,"slug":"lote-um-prestador","category_slug":"hogar","primary_specialty_es_ar":"Instalação elétrica","primary_specialty_pt_br":"Instalação elétrica","secondary_specialties":[],"bio":"Atendimento residencial com experiência comprovada.","years_of_experience":5,"neighborhood":"Centro","coverage_zones":["Centro"],"languages":["Português"],"schedule_summary":"Segunda a sexta","accepts_direct_contact":true,"accepts_quote_requests":true,"reference_starting_price":null,"status":"draft"}'::jsonb)$$,
  'complete active client can promote through the profile-save RPC'
);
SELECT is(
  (SELECT p.role::text || ':' || pp.status::text FROM public.profiles p JOIN public.professional_profiles pp ON pp.user_id = p.id WHERE p.id = '10000000-0000-4000-8000-000000000001'),
  'professional:draft',
  'promotion changes role and creates a draft profile atomically'
);
RESET ROLE;
DO $$
BEGIN
  IF to_regclass('public.service_requests') IS NOT NULL
     AND to_regclass('public.service_quotes') IS NOT NULL THEN
    INSERT INTO public.service_requests (id, client_id, category_slug, country, currency, title, description, city)
    VALUES ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000004', 'hogar', 'BR', 'BRL', 'Synthetic service request', 'A synthetic request used only to test role transition safeguards.', 'Sao Paulo');
    INSERT INTO public.service_quotes (id, request_id, professional_id, amount_minor, currency, description, status)
    VALUES ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 10000, 'BRL', 'Synthetic active service quote', 'sent');
  END IF;
END $$;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '10000000-0000-4000-8000-000000000001';
SELECT CASE
  WHEN to_regclass('public.service_quotes') IS NOT NULL THEN
    throws_ok(
      $$SELECT public.switch_own_account_to_client()$$,
      '55000', 'Close active quote requests or services before changing to client.',
      'professional with an active marketplace quote cannot change to client'
    )
  ELSE skip('marketplace service_quotes table not present in production baseline', 1)
END;
RESET ROLE;
UPDATE public.conversations SET quote_status = 'closed'
WHERE id IN (
  SELECT conversation_id FROM public.conversation_participants
  WHERE user_id = '10000000-0000-4000-8000-000000000001'
);
DO $$
BEGIN
  IF to_regclass('public.service_quotes') IS NOT NULL
     AND to_regclass('public.bookings') IS NOT NULL THEN
    UPDATE public.service_quotes SET status = 'withdrawn' WHERE id = '30000000-0000-4000-8000-000000000001';
    INSERT INTO public.bookings (
      id, request_id, quote_id, client_id, professional_id, service_amount_minor,
      commission_rate_bps, commission_amount_minor, customer_total_minor,
      professional_plan_snapshot, country, currency, status
    ) VALUES (
      '40000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001',
      '30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000004',
      '10000000-0000-4000-8000-000000000001', 10000, 1000, 1000, 11000, 'free', 'BR', 'BRL', 'confirmed'
    );
  END IF;
END $$;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '10000000-0000-4000-8000-000000000001';
SELECT CASE
  WHEN to_regclass('public.bookings') IS NOT NULL THEN
    throws_ok(
      $$SELECT public.switch_own_account_to_client()$$,
      '55000', 'Complete or cancel active services before changing to client.',
      'professional with an active booking cannot change to client'
    )
  ELSE skip('marketplace bookings table not present in production baseline', 1)
END;
RESET ROLE;
DO $$
BEGIN
  IF to_regclass('public.bookings') IS NOT NULL THEN
    UPDATE public.bookings SET status = 'cancelled' WHERE id = '40000000-0000-4000-8000-000000000001';
  END IF;
END $$;
UPDATE public.conversations SET quote_status = 'quote_requested'
WHERE id IN (
  SELECT conversation_id FROM public.conversation_participants
  WHERE user_id = '10000000-0000-4000-8000-000000000001'
);
SET LOCAL ROLE authenticated;
SELECT throws_ok(
  $$SELECT public.switch_own_account_to_client()$$,
  '55000', 'Close active quote requests or services before changing to client.',
  'professional with an active quote cannot change to client'
);

SET LOCAL "request.jwt.claim.sub" = '10000000-0000-4000-8000-000000000006';
SELECT lives_ok(
  $$SELECT public.switch_own_account_to_client()$$,
  'professional without active quotes can change back to client'
);
SELECT is(
  (SELECT p.role::text || ':' || pp.status::text FROM public.profiles p JOIN public.professional_profiles pp ON pp.user_id = p.id WHERE p.id = '10000000-0000-4000-8000-000000000006'),
  'client:draft',
  'demotion unpublishes the profile and preserves its row'
);

SELECT * FROM finish();
ROLLBACK;
