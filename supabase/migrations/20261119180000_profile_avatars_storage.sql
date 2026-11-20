-- Fase 5.1: Bucket dedicado e políticas RLS estritas para upload de foto de perfil.
-- Não altera as migrations A, C0, B ou C1.
-- Bucket `public = true` permite GET direto via /storage/v1/object/public/profile-avatars/<path>
-- sem exigir policy SELECT aberta a `anon` (impedindo enumeração pública via list()).
-- Listagem, escrita, atualização e exclusão ficam restritas ao usuário autenticado na própria pasta;
-- contas suspensas não podem enviar ou sobrescrever arquivos.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-avatars',
  'profile-avatars',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Leitura pública de avatares de perfil" on storage.objects;
drop policy if exists "Usuário autenticado lista próprios avatares" on storage.objects;
create policy "Usuário autenticado lista próprios avatares"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'profile-avatars'
    and array_length(storage.foldername(name), 1) = 1
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Usuário autenticado envia próprio avatar" on storage.objects;
create policy "Usuário autenticado envia próprio avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'profile-avatars'
    and array_length(storage.foldername(name), 1) = 1
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and name ~ ('^' || (select auth.uid())::text || '/avatar-[a-z0-9-]+\.(jpg|jpeg|png|webp)$')
    and exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and not p.is_suspended
    )
  );

drop policy if exists "Usuário autenticado atualiza próprio avatar" on storage.objects;
create policy "Usuário autenticado atualiza próprio avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'profile-avatars'
    and array_length(storage.foldername(name), 1) = 1
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'profile-avatars'
    and array_length(storage.foldername(name), 1) = 1
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and name ~ ('^' || (select auth.uid())::text || '/avatar-[a-z0-9-]+\.(jpg|jpeg|png|webp)$')
    and exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and not p.is_suspended
    )
  );

drop policy if exists "Usuário autenticado remove próprio avatar" on storage.objects;
create policy "Usuário autenticado remove próprio avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'profile-avatars'
    and array_length(storage.foldername(name), 1) = 1
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
