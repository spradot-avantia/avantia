-- 0017_materiales_archivo.sql
-- Materiales con archivo propio (ADR 030): además del enlace https, un material puede ser un
-- archivo subido a Supabase Storage (bucket PRIVADO `materiales`). Idempotente.
--
-- Aislamiento: la ruta del objeto es {tenant_id}/{curso_id}/{uuid}.{ext} y las políticas de
-- storage.objects exigen que la primera carpeta sea el tenant del usuario. El alumno nunca
-- lee el bucket directo: la aplicación emite URLs firmadas de corta duración (F3).
-- La cuota por academia (100 MB en plan Free) y el tope por archivo (25 MB) se validan en la
-- aplicación; el bucket impone además el tope por archivo y la lista de tipos.

alter table materiales add column if not exists origen text not null default 'enlace';
alter table materiales add column if not exists storage_path text;
alter table materiales add column if not exists archivo_nombre text;
alter table materiales add column if not exists mime text;
alter table materiales add column if not exists bytes integer;

alter table materiales drop constraint if exists materiales_origen_check;
alter table materiales add constraint materiales_origen_check check (origen in ('enlace', 'archivo'));
alter table materiales drop constraint if exists materiales_bytes_check;
alter table materiales add constraint materiales_bytes_check check (bytes is null or bytes between 1 and 26214400);
alter table materiales drop constraint if exists materiales_archivo_coherente;
alter table materiales add constraint materiales_archivo_coherente check (
  (origen = 'enlace' and storage_path is null and archivo_nombre is null and mime is null and bytes is null)
  or (origen = 'archivo' and url is null)
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'materiales', 'materiales', false, 26214400,
  array[
    'application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists materiales_obj_select on storage.objects;
create policy materiales_obj_select on storage.objects
  for select using (bucket_id = 'materiales' and (storage.foldername(name))[1] = auth_tenant_id()::text);
drop policy if exists materiales_obj_insert on storage.objects;
create policy materiales_obj_insert on storage.objects
  for insert with check (bucket_id = 'materiales' and (storage.foldername(name))[1] = auth_tenant_id()::text);
drop policy if exists materiales_obj_delete on storage.objects;
create policy materiales_obj_delete on storage.objects
  for delete using (bucket_id = 'materiales' and (storage.foldername(name))[1] = auth_tenant_id()::text);
