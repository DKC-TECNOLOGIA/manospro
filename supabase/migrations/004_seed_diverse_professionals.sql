-- =============================================================================
-- SEED DE PROFISSIONAIS REAIS DE DIVERSAS ÁREAS (ARGENTINA E BRASIL)
-- Cria usuários em auth.users e vincula em profiles, professional_profiles, services e photos
-- =============================================================================

do $$
declare
  u_diego uuid := 'a1111111-1111-1111-1111-111111111111';
  u_matias uuid := 'a2222222-2222-2222-2222-222222222222';
  u_valeria uuid := 'a3333333-3333-3333-3333-333333333333';
  u_lucas uuid := 'a4444444-4444-4444-4444-444444444444';
  u_marcos uuid := 'a5555555-5555-5555-5555-555555555555';
  u_rodrigo uuid := 'a6666666-6666-6666-6666-666666666666';
  u_camila uuid := 'a7777777-7777-7777-7777-777777777777';
begin
  -- 1. Inserir em auth.users para satisfazer a foreign key
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values
    (u_diego, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'diego.plomeria@manospro.com', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"professional"}', now(), now()),
    (u_matias, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'matias.construccion@manospro.com', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"professional"}', now(), now()),
    (u_valeria, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'valeria.estetica@manospro.com', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"professional"}', now(), now()),
    (u_lucas, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lucas.jardin@manospro.com', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"professional"}', now(), now()),
    (u_marcos, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'marcos.fletes@manospro.com', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"professional"}', now(), now()),
    (u_rodrigo, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rodrigo.marceneiro.br@manospro.com', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"professional"}', now(), now()),
    (u_camila, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'camila.cuidadora.br@manospro.com', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"professional"}', now(), now())
  on conflict (id) do nothing;

  -- 2. Inserir em public.profiles
  insert into public.profiles (id, role, full_name, phone, country, city, avatar_url, is_suspended)
  values
    (u_diego, 'professional', 'Diego Santoro', '+54 11 4589-2210', 'AR', 'Buenos Aires (CABA)', 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&q=80', false),
    (u_matias, 'professional', 'Matías Rossi', '+54 11 6320-1144', 'AR', 'Buenos Aires (CABA)', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80', false),
    (u_valeria, 'professional', 'Valeria Benítez', '+54 11 5124-9988', 'AR', 'Buenos Aires (CABA)', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80', false),
    (u_lucas, 'professional', 'Lucas Varela', '+54 11 3344-7766', 'AR', 'Buenos Aires (CABA)', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80', false),
    (u_marcos, 'professional', 'Marcos Giménez', '+54 11 7788-9900', 'AR', 'Buenos Aires (CABA)', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80', false),
    (u_rodrigo, 'professional', 'Rodrigo Silva', '+55 11 98877-6655', 'BR', 'São Paulo', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80', false),
    (u_camila, 'professional', 'Camila Duarte', '+55 11 97766-5544', 'BR', 'São Paulo', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80', false)
  on conflict (id) do update
  set full_name = excluded.full_name,
      avatar_url = excluded.avatar_url,
      country = excluded.country,
      city = excluded.city;

  -- 3. Inserir em public.professional_profiles
  insert into public.professional_profiles (
    user_id, slug, category_slug, primary_specialty_es_ar, primary_specialty_pt_br, secondary_specialties,
    bio, years_of_experience, neighborhood, coverage_zones, languages, schedule_summary,
    accepts_direct_contact, accepts_quote_requests, reference_starting_price, currency, status, verification_status
  ) values
    (
      u_diego,
      'diego-santoro-plomeria-hogar',
      'hogar',
      'Plomero y Reparaciones del Hogar',
      'Encanador e Reparos Residenciais',
      array['Destapaciones', 'Instalación de griferías', 'Bombas de agua', 'Termotanques'],
      'Especialista en plomería residencial con más de 12 años de experiencia. Reparación de pérdidas, cambios de cañerías e instalación de artefactos con garantía.',
      12,
      'Caballito',
      array['Caballito', 'Almagro', 'Villa Crespo', 'Flores'],
      array['Español'],
      'Lun a Sáb 08:00 a 19:00 · Urgencias 24h',
      true, true, 25000, 'ARS', 'published', 'verified'
    ),
    (
      u_matias,
      'matias-rossi-construccion-drywall',
      'construccion',
      'Obras, Drywall y Pintura de Obra',
      'Reformas, Gesso e Pintura Profissional',
      array['Construcción en seco', 'Colocación de porcelanatos', 'Pintura látex y sintético'],
      'Maestro mayor de obra dedicado a reformas integrales, cielorrasos de Durlock y pintura de interiores y exteriores con terminaciones de alta calidad.',
      15,
      'Belgrano',
      array['Belgrano', 'Núñez', 'Colegiales', 'Palermo'],
      array['Español'],
      'Lun a Vie 08:00 a 18:00',
      true, true, 35000, 'ARS', 'published', 'verified'
    ),
    (
      u_valeria,
      'valeria-benitez-belleza-bienestar',
      'belleza-y-bienestar',
      'Esteticista y Masajista Profesional',
      'Esteticista e Massoterapeuta',
      array['Masajes descontracturantes', 'Limpieza facial profunda', 'Drenaje linfático'],
      'Atención personalizada a domicilio y en gabinete propio. Tratamientos faciales y corporales para el bienestar y la relajación.',
      7,
      'Palermo',
      array['Palermo', 'Recoleta', 'Barrio Norte'],
      array['Español', 'English'],
      'Mar a Sáb 09:00 a 20:00',
      true, true, 18000, 'ARS', 'published', 'unverified'
    ),
    (
      u_lucas,
      'lucas-varela-jardineria-paisajismo',
      'jardineria',
      'Jardinería, Poda y Mantenimiento de Parques',
      'Jardinagem, Paisagismo e Manutenção',
      array['Corte de césped', 'Poda de árboles', 'Riego automático', 'Control de plagas'],
      'Diseño y mantenimiento integral de jardines residenciales y comerciales. Maquinaria propia y retiro de restos de poda.',
      9,
      'San Isidro',
      array['San Isidro', 'Vicente López', 'Olivos', 'Martínez'],
      array['Español'],
      'Lun a Sáb 07:30 a 17:30',
      true, true, 22000, 'ARS', 'published', 'verified'
    ),
    (
      u_marcos,
      'marcos-gimenez-fletes-transporte',
      'transporte',
      'Fletes, Minifletes y Mudanzas Urbanas',
      'Fretes, Carretos e Mudanças',
      array['Fletes por hora', 'Mudanzas completas con peones', 'Reparto de mercadería'],
      'Camioneta utilitaria y furgón cerrado para traslados seguros y puntuales. Cuidado especial en el embalaje y descarga de muebles.',
      8,
      'Villa Urquiza',
      array['Villa Urquiza', 'Saavedra', 'CABA', 'Zona Norte'],
      array['Español'],
      'Lun a Dom 07:00 a 20:00',
      true, true, 30000, 'ARS', 'published', 'unverified'
    ),
    (
      u_rodrigo,
      'rodrigo-silva-marcenaria-moveis',
      'hogar',
      'Carpintería y Muebles a Medida',
      'Marcenaria Fina e Móveis Planejados',
      array['Móveis sob medida', 'Reparos em portas e janelas', 'Restauração de madeira'],
      'Marceneiro profissional com experiência em móveis de alto padrão para cozinha, dormitório e escritórios. Orçamentos transparentes.',
      14,
      'Pinheiros',
      array['Pinheiros', 'Vila Madalena', 'Jardins', 'Perdizes'],
      array['Português'],
      'Seg a Sex 08:00 às 18:00',
      true, true, 250, 'BRL', 'published', 'verified'
    ),
    (
      u_camila,
      'camila-duarte-cuidado-saude',
      'salud',
      'Cuidado Domiciliario y Acompañamiento',
      'Cuidadora de Idosos e Acompanhamento',
      array['Acompanhamento hospitalar', 'Administração de medicamentos', 'Rotinas de mobilidade'],
      'Profissional capacitada em cuidados gerontológicos e assistência domiciliar com foco no carinho, respeito e segurança da família.',
      6,
      'Moema',
      array['Moema', 'Vila Mariana', 'Saúde', 'Campo Belo'],
      array['Português'],
      'Escalas diurnas e noturnas combinadas',
      true, true, 180, 'BRL', 'published', 'verified'
    )
  on conflict (user_id) do update
  set slug = excluded.slug,
      category_slug = excluded.category_slug,
      primary_specialty_es_ar = excluded.primary_specialty_es_ar,
      primary_specialty_pt_br = excluded.primary_specialty_pt_br,
      secondary_specialties = excluded.secondary_specialties,
      bio = excluded.bio,
      years_of_experience = excluded.years_of_experience,
      neighborhood = excluded.neighborhood,
      coverage_zones = excluded.coverage_zones,
      reference_starting_price = excluded.reference_starting_price,
      currency = excluded.currency,
      status = 'published',
      verification_status = excluded.verification_status;

  -- 4. Inserir serviços de exemplo
  insert into public.services (professional_id, title, description, reference_price_amount, currency, price_unit_label)
  values
    (u_diego, 'Destapación de cañerías y desagües', 'Destapación con máquina rotativa eléctrica de cocina, baño o pluvial.', 25000, 'ARS', 'servicio base'),
    (u_diego, 'Instalación y reparación de griferías', 'Cambio de flexibles, vástagos, canillas monocomando o tradicionales.', 18000, 'ARS', 'por unidad'),
    (u_matias, 'Cielorraso de Durlock con moldura', 'Colocación de estructura galvanizada, placas de yeso y masillado listo para pintar.', 35000, 'ARS', 'por m²'),
    (u_matias, 'Pintura látex interior al agua', 'Dos manos de látex lavable de primera marca con enduido previo.', 15000, 'ARS', 'por m²'),
    (u_valeria, 'Masaje descontracturante completo', 'Sesión de 60 minutos con aromaterapia y piedras calientes.', 18000, 'ARS', 'por sesión'),
    (u_lucas, 'Corte de césped y bordeado', 'Corte con máquina helicoidal y limpieza de bordes para terrenos hasta 400m².', 22000, 'ARS', 'por servicio'),
    (u_marcos, 'Flete urbano básico con chofer', 'Traslado en furgón cerrado de hasta 1500 kg en CABA.', 30000, 'ARS', 'por viaje'),
    (u_rodrigo, 'Fabricação de armário planejado', 'Armário sob medida em MDF 18mm com dobradiças amortecedoras.', 850, 'BRL', 'por metro linear'),
    (u_camila, 'Plantão diurno de cuidados (8 horas)', 'Auxílio na alimentação, higiene, medicação e caminhada assistida.', 220, 'BRL', 'por plantão')
  on conflict do nothing;

end $$;
