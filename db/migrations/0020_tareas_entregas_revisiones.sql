-- 0020_tareas_entregas_revisiones.sql
-- Tareas con entrega de archivo y revisión del creador (ADR 038). Idempotente.
--
-- Aislamiento por tenant: las tres tablas llevan tenant_id, RLS e índice compuesto que empieza
-- por tenant_id; las claves foráneas son compuestas (id + tenant) para que una entrega no pueda
-- apuntar a una tarea ni a un alumno de otra academia.
-- Quién escribe qué:
--  · tareas: el creador (sesión + RLS por tenant).
--  · entregas: SOLO el servidor con service_role, derivando alumno y tenant de la sesión del
--    alumno (los alumnos no tienen JWT de Supabase, ADR 018). El creador solo las lee.
--  · revisiones: el creador (sesión + RLS). El alumno la ve cuando publicada_at no es nulo
--    (lo filtra la aplicación al leer con service_role).
-- Archivos: bucket PRIVADO `entregas`, ruta {tenant_id}/{tarea_id}/{alumno_id}/{uuid}.{ext}.
-- La subida la hace el servidor (URL firmada de subida emitida tras validar la sesión del
-- alumno); el creador solo puede LEER objetos de su academia.

create table if not exists tareas (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  curso_id uuid not null,
  leccion_id uuid not null,
  titulo text not null check (char_length(btrim(titulo)) between 1 and 120),
  instrucciones text not null default '' check (char_length(instrucciones) <= 20000),
  -- Puntaje libre: el creador define el máximo (p. ej. 30).
  puntaje_maximo numeric(6,2) not null check (puntaje_maximo > 0 and puntaje_maximo <= 10000),
  fecha_limite timestamptz,
  permite_reenvio boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, tenant_id),
  -- Una tarea por lección.
  unique (tenant_id, leccion_id),
  foreign key (curso_id, tenant_id) references cursos (id, tenant_id) on delete cascade,
  foreign key (leccion_id, tenant_id) references lecciones (id, tenant_id) on delete cascade
);
create index if not exists tareas_tenant_curso_idx on tareas (tenant_id, curso_id);

create table if not exists entregas (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  tarea_id uuid not null,
  alumno_id uuid not null,
  -- Los reenvíos conservan el historial: 1, 2, 3…
  numero integer not null default 1 check (numero between 1 and 20),
  storage_path text not null check (char_length(storage_path) <= 500),
  archivo_nombre text not null check (char_length(archivo_nombre) between 1 and 200),
  mime text not null,
  bytes integer not null check (bytes between 1 and 26214400),
  comentario_alumno text check (comentario_alumno is null or char_length(comentario_alumno) <= 2000),
  enviada_at timestamptz not null default now(),
  unique (id, tenant_id),
  unique (tenant_id, tarea_id, alumno_id, numero),
  -- Una ruta de bucket no puede enlazarse a dos entregas.
  unique (storage_path),
  foreign key (tarea_id, tenant_id) references tareas (id, tenant_id) on delete cascade,
  foreign key (alumno_id, tenant_id) references alumnos (id, tenant_id) on delete cascade
);
create index if not exists entregas_tenant_tarea_idx on entregas (tenant_id, tarea_id, enviada_at desc);
create index if not exists entregas_tenant_alumno_idx on entregas (tenant_id, alumno_id);

create table if not exists revisiones (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  entrega_id uuid not null,
  puntaje numeric(6,2) not null check (puntaje >= 0),
  -- Dónde mejorar.
  comentario text not null default '' check (char_length(comentario) <= 10000),
  revisada_at timestamptz not null default now(),
  -- Nulo = borrador: el alumno aún no la ve.
  publicada_at timestamptz,
  unique (tenant_id, entrega_id),
  foreign key (entrega_id, tenant_id) references entregas (id, tenant_id) on delete cascade
);
create index if not exists revisiones_tenant_publicada_idx on revisiones (tenant_id, publicada_at);

-- El puntaje no puede superar el máximo de la tarea (un check no puede mirar otra tabla).
create or replace function revisiones_valida_puntaje() returns trigger
language plpgsql set search_path = public as $$
declare maximo numeric;
begin
  select t.puntaje_maximo into maximo
  from entregas e join tareas t on t.id = e.tarea_id and t.tenant_id = e.tenant_id
  where e.id = new.entrega_id and e.tenant_id = new.tenant_id;
  if maximo is null then
    raise exception 'entrega inexistente para esta academia';
  end if;
  if new.puntaje > maximo then
    raise exception 'el puntaje (%) supera el máximo de la tarea (%)', new.puntaje, maximo;
  end if;
  return new;
end $$;
drop trigger if exists revisiones_valida_puntaje_trg on revisiones;
create trigger revisiones_valida_puntaje_trg before insert or update of puntaje on revisiones
  for each row execute function revisiones_valida_puntaje();

drop trigger if exists tareas_set_updated_at on tareas;
create trigger tareas_set_updated_at before update on tareas
  for each row execute function set_updated_at();

alter table tareas enable row level security;
alter table entregas enable row level security;
alter table revisiones enable row level security;

drop policy if exists tareas_select_por_tenant on tareas;
create policy tareas_select_por_tenant on tareas for select using (tenant_id = auth_tenant_id());
drop policy if exists tareas_insert_por_tenant on tareas;
create policy tareas_insert_por_tenant on tareas for insert with check (tenant_id = auth_tenant_id());
drop policy if exists tareas_update_por_tenant on tareas;
create policy tareas_update_por_tenant on tareas
  for update using (tenant_id = auth_tenant_id()) with check (tenant_id = auth_tenant_id());
drop policy if exists tareas_delete_por_tenant on tareas;
create policy tareas_delete_por_tenant on tareas for delete using (tenant_id = auth_tenant_id());

-- Entregas: el creador solo lee; las escribe el servidor.
drop policy if exists entregas_select_por_tenant on entregas;
create policy entregas_select_por_tenant on entregas for select using (tenant_id = auth_tenant_id());

drop policy if exists revisiones_select_por_tenant on revisiones;
create policy revisiones_select_por_tenant on revisiones for select using (tenant_id = auth_tenant_id());
drop policy if exists revisiones_insert_por_tenant on revisiones;
create policy revisiones_insert_por_tenant on revisiones for insert with check (tenant_id = auth_tenant_id());
drop policy if exists revisiones_update_por_tenant on revisiones;
create policy revisiones_update_por_tenant on revisiones
  for update using (tenant_id = auth_tenant_id()) with check (tenant_id = auth_tenant_id());
drop policy if exists revisiones_delete_por_tenant on revisiones;
create policy revisiones_delete_por_tenant on revisiones for delete using (tenant_id = auth_tenant_id());

revoke all on tareas, entregas, revisiones from anon;
grant select, insert, update, delete on tareas, revisiones to authenticated;
grant select on entregas to authenticated;
grant select, insert, update, delete on tareas, entregas, revisiones to service_role;

-- Bucket privado de entregas (mismos tipos que `materiales`, tope 25 MB).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'entregas', 'entregas', false, 26214400,
  array[
    'application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- El creador solo LEE los objetos de su academia; subir y borrar lo hace el servidor.
drop policy if exists entregas_obj_select on storage.objects;
create policy entregas_obj_select on storage.objects
  for select using (bucket_id = 'entregas' and (storage.foldername(name))[1] = auth_tenant_id()::text);
