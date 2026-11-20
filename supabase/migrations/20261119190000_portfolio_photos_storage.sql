-- Bucket dedicado e políticas RLS estritas para upload de fotos de trabalhos (portfólio).
-- Não altera migrations de segurança já aplicadas (A, C0, B, C1) nem o bucket profile-avatars.
-- Bucket `public = true` permite GET direto via /storage/v1/object/public/portfolio-photos/<path>
-- sem exigir policy SELECT aberta a `anon` (impedindo enumeração pública via list()).
-- Upload e atualização restritos a profissionais ativos (incluindo rascunho ou verificação pendente),
-- bloqueando contas `client`, contas suspensas e fichas profissionais suspensas.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-photos',
  'portfolio-photos',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Leitura pública de fotos de portfólio" on storage.objects;
drop policy if exists "Profissional autenticado lista próprias fotos de portfólio" on storage.objects;
create policy "Profissional autenticado lista próprias fotos de portfólio"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'portfolio-photos'
    and array_length(storage.foldername(name), 1) = 1
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Profissional autenticado envia própria foto de portfólio" on storage.objects;
create policy "Profissional autenticado envia própria foto de portfólio"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'portfolio-photos'
    and array_length(storage.foldername(name), 1) = 1
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and name ~ ('^' || (select auth.uid())::text || '/work-[a-z0-9-]+\.(jpg|jpeg|png|webp)$')
    and exists (
      select 1
      from public.profiles p
      join public.professional_profiles pp on pp.user_id = p.id
      where p.id = (select auth.uid())
        and p.role = 'professional'::public.account_role
        and not p.is_suspended
        and pp.status <> 'suspended'::public.professional_status
    )
  );

drop policy if exists "Profissional autenticado atualiza própria foto de portfólio" on storage.objects;
create policy "Profissional autenticado atualiza própria foto de portfólio"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'portfolio-photos'
    and array_length(storage.foldername(name), 1) = 1
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'portfolio-photos'
    and array_length(storage.foldername(name), 1) = 1
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and name ~ ('^' || (select auth.uid())::text || '/work-[a-z0-9-]+\.(jpg|jpeg|png|webp)$')
    and exists (
      select 1
      from public.profiles p
      join public.professional_profiles pp on pp.user_id = p.id
      where p.id = (select auth.uid())
        and p.role = 'professional'::public.account_role
        and not p.is_suspended
        and pp.status <> 'suspended'::public.professional_status
    )
  );

drop policy if exists "Profissional autenticado remove própria foto de portfólio" on storage.objects;
create policy "Profissional autenticado remove própria foto de portfólio"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'portfolio-photos'
    and array_length(storage.foldername(name), 1) = 1
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
