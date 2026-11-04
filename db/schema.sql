-- Esquema base de Avantia. Toda tabla de negocio lleva tenant_id + política
-- de Row-Level Security: es la última línea de defensa del aislamiento
-- multi-tenant, pero cada consulta desde el backend igual debe filtrar
-- explícitamente por tenant_id (ver docs/arquitectura).

create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  subdomain text unique not null,
  custom_domain text unique,
  nombre text not null,
  logo_url text,
  color_primario text default '#000000',
  created_at timestamptz not null default now()
);

create table if not exists cursos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  slug text not null,
  titulo text not null,
  descripcion text,
  precio_centavos integer not null default 0,
  created_at timestamptz not null default now(),
  unique (tenant_id, slug)
);

create index if not exists cursos_tenant_id_idx on cursos (tenant_id);

alter table cursos enable row level security;

-- Membresía profesor <-> tenant: qué usuario autenticado (auth.users) puede
-- operar sobre qué tenant. Es la tabla de la que auth_tenant_id() resuelve
-- el tenant del usuario logueado.
create table if not exists membresias (
  user_id uuid not null references auth.users(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, tenant_id)
);

create index if not exists membresias_tenant_id_idx on membresias (tenant_id);

-- service_role bypasa RLS pero igual necesita el grant a nivel de tabla;
-- sin esto, el seed (scripts/seed.mjs) y cualquier acceso admin fallan con
-- "permission denied for table ...".
grant select, insert, update, delete on tenants, cursos, membresias to service_role;

-- Resuelve el tenant del usuario autenticado a partir de su membresía.
-- security definer + search_path fijo para poder leer `membresias` desde
-- dentro de una política RLS sin depender de permisos del rol que consulta.
-- Si el usuario tiene más de una membresía, esta función solo devuelve una
-- (sin orden garantizado); hoy asumimos un usuario por tenant.
create or replace function auth_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id
  from membresias
  where user_id = auth.uid()
  limit 1
$$;

-- Ejemplo de política RLS: un usuario solo puede ver cursos de su propio
-- tenant, resuelto vía auth_tenant_id().
create policy cursos_select_por_tenant on cursos
  for select
  using (tenant_id = auth_tenant_id());


-- ===========================================================================
-- Espacio del Creador (migracion 0001_espacio_creador.sql, reflejada aqui)
-- ===========================================================================

-- 0001_espacio_creador.sql
-- Espacio del Creador: marca de la academia, cursos con estado/modalidad/acceso,
-- modulos y lecciones reales (ADR 006), invitaciones por curso (ADR 007) y
-- bucket de logos por tenant (ADR 005). NO aplicada a ninguna base remota.
-- Idempotente donde es razonable (if not exists / drop policy if exists).

-- ---------------------------------------------------------------------------
-- Utilidad: updated_at automatico
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end
$$;

-- ---------------------------------------------------------------------------
-- tenants: marca y datos de onboarding
-- ---------------------------------------------------------------------------
alter table tenants
  add column if not exists frase text,
  add column if not exists area text,
  add column if not exists logo_modo text not null default 'logo_y_nombre',
  add column if not exists pais text,
  add column if not exists moneda text,
  add column if not exists onboarding_completado_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

alter table tenants drop constraint if exists tenants_logo_modo_check;
alter table tenants add constraint tenants_logo_modo_check
  check (logo_modo in ('logo_y_nombre', 'solo_logo'));

alter table tenants drop constraint if exists tenants_color_primario_check;
alter table tenants add constraint tenants_color_primario_check
  check (color_primario is null or color_primario ~* '^#[0-9a-f]{6}$');

drop trigger if exists tenants_set_updated_at on tenants;
create trigger tenants_set_updated_at before update on tenants
  for each row execute function set_updated_at();

-- tenants no tenia RLS. Se habilita: el miembro ve y edita SOLO su tenant.
-- Sin politica de insert/delete: el alta de tenants la hace el backend con
-- service role (RQ-02). El sitio publico resuelve tenants con admin.ts.
alter table tenants enable row level security;

drop policy if exists tenants_select_propio on tenants;
create policy tenants_select_propio on tenants
  for select using (id = auth_tenant_id());

drop policy if exists tenants_update_propio on tenants;
create policy tenants_update_propio on tenants
  for update using (id = auth_tenant_id()) with check (id = auth_tenant_id());

-- ---------------------------------------------------------------------------
-- cursos: estado, publico, modalidad, fechas, acceso
-- ---------------------------------------------------------------------------
alter table cursos
  add column if not exists estado text not null default 'publicado',
  add column if not exists publico text,
  add column if not exists modalidad text not null default 'a_su_ritmo',
  add column if not exists fecha_inicio date,
  add column if not exists fecha_termino date,
  add column if not exists acceso text not null default 'invitados',
  add column if not exists published_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

-- Los cursos previos (seed) quedan publicados; los nuevos nacen en borrador.
update cursos set published_at = created_at where estado = 'publicado' and published_at is null;
alter table cursos alter column estado set default 'borrador';

alter table cursos drop constraint if exists cursos_estado_check;
alter table cursos add constraint cursos_estado_check
  check (estado in ('borrador', 'publicado'));
alter table cursos drop constraint if exists cursos_modalidad_check;
alter table cursos add constraint cursos_modalidad_check
  check (modalidad in ('a_su_ritmo', 'con_fechas'));
alter table cursos drop constraint if exists cursos_acceso_check;
alter table cursos add constraint cursos_acceso_check
  check (acceso in ('invitados', 'enlace'));
alter table cursos drop constraint if exists cursos_fechas_check;
alter table cursos add constraint cursos_fechas_check
  check (fecha_termino is null or fecha_inicio is null or fecha_termino >= fecha_inicio);

-- (tenant_id, slug) ya es unique desde el esquema base.
-- Clave unica extra para FKs compuestas que garantizan coherencia de tenant.
-- No se hace drop/add: las FKs compuestas de modulos, lecciones, etc. dependen
-- de esta clave y el drop falla al re-ejecutar la migracion.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cursos_id_tenant_id_key' and conrelid = 'public.cursos'::regclass
  ) then
    alter table cursos add constraint cursos_id_tenant_id_key unique (id, tenant_id);
  end if;
end $$;

create index if not exists cursos_tenant_estado_idx on cursos (tenant_id, estado);

drop trigger if exists cursos_set_updated_at on cursos;
create trigger cursos_set_updated_at before update on cursos
  for each row execute function set_updated_at();

drop policy if exists cursos_insert_por_tenant on cursos;
create policy cursos_insert_por_tenant on cursos
  for insert with check (tenant_id = auth_tenant_id());
drop policy if exists cursos_update_por_tenant on cursos;
create policy cursos_update_por_tenant on cursos
  for update using (tenant_id = auth_tenant_id()) with check (tenant_id = auth_tenant_id());
drop policy if exists cursos_delete_por_tenant on cursos;
create policy cursos_delete_por_tenant on cursos
  for delete using (tenant_id = auth_tenant_id());

-- ---------------------------------------------------------------------------
-- curso_objetivos: 1 a 3 por curso ("Al terminar podran...")
-- ---------------------------------------------------------------------------
create table if not exists curso_objetivos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  curso_id uuid not null,
  orden smallint not null check (orden between 1 and 3),
  texto text not null check (char_length(texto) between 1 and 200),
  created_at timestamptz not null default now(),
  unique (curso_id, orden),
  foreign key (curso_id, tenant_id) references cursos (id, tenant_id) on delete cascade
);
create index if not exists curso_objetivos_tenant_curso_idx on curso_objetivos (tenant_id, curso_id);

-- ---------------------------------------------------------------------------
-- modulos
-- ---------------------------------------------------------------------------
create table if not exists modulos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  curso_id uuid not null,
  titulo text not null check (char_length(titulo) between 1 and 120),
  orden integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, tenant_id),
  foreign key (curso_id, tenant_id) references cursos (id, tenant_id) on delete cascade
);
create index if not exists modulos_tenant_curso_orden_idx on modulos (tenant_id, curso_id, orden);

drop trigger if exists modulos_set_updated_at on modulos;
create trigger modulos_set_updated_at before update on modulos
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- lecciones (tipo video | texto | documento; documento = solo enlace, ADR 006)
-- ---------------------------------------------------------------------------
create table if not exists lecciones (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  curso_id uuid not null,
  modulo_id uuid not null,
  titulo text not null check (char_length(titulo) between 1 and 120),
  tipo text not null default 'video' check (tipo in ('video', 'texto', 'documento')),
  contenido_url text,
  contenido_texto text,
  -- Evolucion a archivos (ADR 005): ruta en bucket privado 'materiales' (no usado en MVP).
  storage_path text,
  contenido_tipo text,
  orden integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (curso_id, tenant_id) references cursos (id, tenant_id) on delete cascade,
  foreign key (modulo_id, tenant_id) references modulos (id, tenant_id) on delete cascade
);
create index if not exists lecciones_tenant_modulo_orden_idx on lecciones (tenant_id, modulo_id, orden);
create index if not exists lecciones_tenant_curso_idx on lecciones (tenant_id, curso_id);

drop trigger if exists lecciones_set_updated_at on lecciones;
create trigger lecciones_set_updated_at before update on lecciones
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- invitaciones: correos registrados por el creador para un curso (ADR 007)
-- ---------------------------------------------------------------------------
create table if not exists invitaciones (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  curso_id uuid not null,
  email text not null check (email = lower(email) and char_length(email) <= 254),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aceptada', 'revocada')),
  created_at timestamptz not null default now(),
  unique (curso_id, email),
  foreign key (curso_id, tenant_id) references cursos (id, tenant_id) on delete cascade
);
create index if not exists invitaciones_tenant_curso_idx on invitaciones (tenant_id, curso_id);
create index if not exists invitaciones_tenant_email_idx on invitaciones (tenant_id, email);

-- ---------------------------------------------------------------------------
-- RLS: 4 operaciones por tabla nueva, por tenant del miembro
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['curso_objetivos', 'modulos', 'lecciones', 'invitaciones'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists %I on %I', t || '_select_por_tenant', t);
    execute format('create policy %I on %I for select using (tenant_id = auth_tenant_id())', t || '_select_por_tenant', t);
    execute format('drop policy if exists %I on %I', t || '_insert_por_tenant', t);
    execute format('create policy %I on %I for insert with check (tenant_id = auth_tenant_id())', t || '_insert_por_tenant', t);
    execute format('drop policy if exists %I on %I', t || '_update_por_tenant', t);
    execute format('create policy %I on %I for update using (tenant_id = auth_tenant_id()) with check (tenant_id = auth_tenant_id())', t || '_update_por_tenant', t);
    execute format('drop policy if exists %I on %I', t || '_delete_por_tenant', t);
    execute format('create policy %I on %I for delete using (tenant_id = auth_tenant_id())', t || '_delete_por_tenant', t);
  end loop;
end
$$;

grant select, insert, update, delete
  on curso_objetivos, modulos, lecciones, invitaciones to service_role;
grant select, insert, update, delete
  on curso_objetivos, modulos, lecciones, invitaciones to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: bucket 'logos' (ADR 005). Ruta: {tenant_id}/<archivo>.
-- Publico de lectura (el logo se muestra en sitios publicos); escritura solo
-- del miembro, y solo dentro de la carpeta de su tenant.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'logos', 'logos', true, 2097152,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists logos_select on storage.objects;
create policy logos_select on storage.objects
  for select using (bucket_id = 'logos');

drop policy if exists logos_insert_por_tenant on storage.objects;
create policy logos_insert_por_tenant on storage.objects
  for insert to authenticated
  with check (bucket_id = 'logos' and (storage.foldername(name))[1] = auth_tenant_id()::text);

drop policy if exists logos_update_por_tenant on storage.objects;
create policy logos_update_por_tenant on storage.objects
  for update to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth_tenant_id()::text)
  with check (bucket_id = 'logos' and (storage.foldername(name))[1] = auth_tenant_id()::text);

drop policy if exists logos_delete_por_tenant on storage.objects;
create policy logos_delete_por_tenant on storage.objects
  for delete to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth_tenant_id()::text);


-- ===========================================================================
-- Alta de academia (migracion 0002_crear_academia.sql, reflejada aqui)
-- ===========================================================================

-- 0002_crear_academia.sql
-- RQ-02: alta transaccional de academia (tenant + membresia dueno + tema base)
-- como funcion SQL invocable por RPC con la sesion del usuario. NO aplicada a
-- ninguna base remota (se pega en el SQL Editor de Supabase).
-- Idempotente: se puede ejecutar mas de una vez.
--
-- Requisitos previos: 0001_espacio_creador.sql aplicada.
--
-- ATENCION (datos existentes): el indice unico membresias_user_id_key falla si
-- algun usuario ya tiene 2+ membresias. Revisar antes con:
--   select user_id, count(*) from membresias group by 1 having count(*) > 1;

-- ---------------------------------------------------------------------------
-- membresias: rol, una academia por usuario (MVP) y RLS
-- ---------------------------------------------------------------------------
alter table membresias
  add column if not exists rol text not null default 'dueno';

alter table membresias drop constraint if exists membresias_rol_check;
alter table membresias add constraint membresias_rol_check check (rol in ('dueno'));

-- MVP: un usuario pertenece a UNA sola academia. Esto vuelve determinista a
-- auth_tenant_id() (una sola fila posible) y es la barrera dura contra dos
-- altas simultaneas del mismo usuario. Al soportar equipos/multi-academia se
-- reemplaza por (user_id, tenant_id) y un tenant "activo" explicito.
create unique index if not exists membresias_user_id_key on membresias (user_id);

-- Antes membresias no tenia RLS. Ahora: cada usuario lee SOLO sus filas.
-- Sin politicas de insert/update/delete para clientes: las membresias solo se
-- crean dentro de crear_academia() (security definer) o con service role.
alter table membresias enable row level security;

drop policy if exists membresias_select_propia on membresias;
create policy membresias_select_propia on membresias
  for select using (user_id = auth.uid());

-- Privilegios minimos. Supabase concede por defecto ALL a anon/authenticated en
-- public; se retira lo que no deben hacer directamente. La escritura de
-- tenants/membresias por el cliente de sesion pasa solo por crear_academia() y
-- por la politica de update de tenants (marca).
revoke all on membresias from anon, authenticated;
grant select on membresias to authenticated;

revoke all on tenants from anon;
revoke insert, delete on tenants from authenticated;
grant select, update on tenants to authenticated;

-- auth_tenant_id(): orden determinista aunque en el futuro se relaje el indice
-- unico (created_at, luego tenant_id).
create or replace function auth_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id
  from membresias
  where user_id = auth.uid()
  order by created_at asc, tenant_id asc
  limit 1
$$;

-- ---------------------------------------------------------------------------
-- Validacion de subdominio (duplica lib/tenant/reservados.ts)
-- ---------------------------------------------------------------------------
-- IMPORTANTE: la lista de reservados y la regex DEBEN mantenerse en sincronia
-- con apps/web/src/lib/tenant/reservados.ts (SUBDOMINIOS_RESERVADOS y FORMATO).
-- Si cambias una, cambia la otra (y crea una migracion nueva con esta funcion).
create or replace function subdominio_error(p_subdomain text)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  s text := lower(btrim(coalesce(p_subdomain, '')));
begin
  if s !~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$' then
    return 'subdominio_invalido';
  end if;
  if s = any (array[
    'app', 'www', 'api', 'admin', 'staging', 'dev', 'mail', 'smtp', 'ftp',
    'docs', 'blog', 'status', 'soporte', 'support', 'ayuda', 'help',
    'login', 'registro', 'auth', 'cdn', 'assets', 'static', 'avantia'
  ]) then
    return 'subdominio_reservado';
  end if;
  return null;
end
$$;

-- ---------------------------------------------------------------------------
-- crear_academia: alta atomica (RQ-02)
-- ---------------------------------------------------------------------------
-- Errores (el mensaje es un codigo estable que el backend mapea a espanol):
--   no_autenticado, nombre_invalido, subdominio_invalido, subdominio_reservado,
--   ya_tiene_academia, subdominio_tomado.
create or replace function crear_academia(
  p_nombre text,
  p_subdomain text,
  p_frase text default null,
  p_area text default null
)
returns tenants
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_nombre text := btrim(coalesce(p_nombre, ''));
  v_sub text := lower(btrim(coalesce(p_subdomain, '')));
  v_frase text := nullif(btrim(coalesce(p_frase, '')), '');
  v_area text := nullif(btrim(coalesce(p_area, '')), '');
  v_err text;
  v_tenant tenants;
  v_constraint text;
begin
  if v_uid is null then
    raise exception 'no_autenticado' using errcode = '28000';
  end if;

  if char_length(v_nombre) not between 2 and 60
     or char_length(coalesce(v_frase, '')) > 100
     or char_length(coalesce(v_area, '')) > 60 then
    raise exception 'nombre_invalido' using errcode = '22023';
  end if;

  v_err := subdominio_error(v_sub);
  if v_err is not null then
    raise exception '%', v_err using errcode = '22023';
  end if;

  -- Serializa altas concurrentes del MISMO usuario (doble clic, dos pestanas).
  perform pg_advisory_xact_lock(hashtextextended('crear_academia:' || v_uid::text, 0));

  if exists (select 1 from membresias where user_id = v_uid) then
    raise exception 'ya_tiene_academia' using errcode = 'P0001';
  end if;

  begin
    -- slug = subdominio. Tema base: color por defecto (azul de marca) y logo
    -- con nombre; el resto se completa en el onboarding.
    insert into tenants (slug, subdomain, nombre, frase, area, color_primario, logo_modo)
    values (v_sub, v_sub, v_nombre, v_frase, v_area, '#2563eb', 'logo_y_nombre')
    returning * into v_tenant;

    insert into membresias (user_id, tenant_id, rol)
    values (v_uid, v_tenant.id, 'dueno');
  exception
    when unique_violation then
      get stacked diagnostics v_constraint = constraint_name;
      if v_constraint like 'membresias%' then
        raise exception 'ya_tiene_academia' using errcode = 'P0001';
      end if;
      raise exception 'subdominio_tomado' using errcode = '23505';
  end;

  return v_tenant;
end
$$;

revoke execute on function crear_academia(text, text, text, text) from public, anon;
grant execute on function crear_academia(text, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- subdominio_disponible: comprobacion en vivo (solo booleano)
-- ---------------------------------------------------------------------------
-- Diseno anti-enumeracion: exige sesion, devuelve SOLO true/false (invalido,
-- reservado y tomado son indistinguibles) y no expone ninguna columna del
-- tenant. Pendiente (Etapa 2): limite de tasa para frenar barridos con una
-- cuenta real; el alta final igual la decide crear_academia().
create or replace function subdominio_disponible(p_subdomain text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  s text := lower(btrim(coalesce(p_subdomain, '')));
begin
  if auth.uid() is null then
    raise exception 'no_autenticado' using errcode = '28000';
  end if;
  if subdominio_error(s) is not null then
    return false;
  end if;
  return not exists (
    select 1 from tenants where subdomain = s or slug = s or custom_domain = s
  );
end
$$;

revoke execute on function subdominio_disponible(text) from public, anon;
grant execute on function subdominio_disponible(text) to authenticated;

revoke execute on function subdominio_error(text) from public, anon;
grant execute on function subdominio_error(text) to authenticated;

-- ===========================================================================
-- 0003_inscripciones_progreso_eventos (ADR 004)
-- ===========================================================================
-- Idempotente donde es razonable (if not exists / drop policy if exists).

-- ---------------------------------------------------------------------------
-- Cohorte simple: liberacion programada por dia (ADR 004)
-- ---------------------------------------------------------------------------
alter table lecciones
  add column if not exists dia_liberacion integer;

alter table lecciones drop constraint if exists lecciones_dia_liberacion_check;
alter table lecciones add constraint lecciones_dia_liberacion_check
  check (dia_liberacion is null or dia_liberacion between 0 and 3650);

-- Clave unica para FKs compuestas que garantizan coherencia de tenant.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'lecciones_id_tenant_id_key' and conrelid = 'public.lecciones'::regclass
  ) then
    alter table lecciones add constraint lecciones_id_tenant_id_key unique (id, tenant_id);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- inscripciones: un alumno en un curso de una academia
-- ---------------------------------------------------------------------------
create table if not exists inscripciones (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  curso_id uuid not null,
  alumno_id uuid not null references auth.users(id) on delete cascade,
  estado text not null default 'activa' check (estado in ('activa', 'cancelada')),
  -- Para modalidad con_fechas: desde cuando cuenta el alumno (ve todo lo ya liberado).
  fecha_inicio_alumno date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (curso_id, alumno_id),
  unique (id, tenant_id),
  foreign key (curso_id, tenant_id) references cursos (id, tenant_id) on delete cascade
);
create index if not exists inscripciones_tenant_curso_idx on inscripciones (tenant_id, curso_id);
create index if not exists inscripciones_tenant_alumno_idx on inscripciones (tenant_id, alumno_id);

drop trigger if exists inscripciones_set_updated_at on inscripciones;
create trigger inscripciones_set_updated_at before update on inscripciones
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- progreso: leccion completada / ultimo acceso por alumno
-- ---------------------------------------------------------------------------
create table if not exists progreso (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  curso_id uuid not null,
  leccion_id uuid not null,
  alumno_id uuid not null references auth.users(id) on delete cascade,
  completada_at timestamptz,
  ultimo_acceso_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (leccion_id, alumno_id),
  foreign key (curso_id, tenant_id) references cursos (id, tenant_id) on delete cascade,
  foreign key (leccion_id, tenant_id) references lecciones (id, tenant_id) on delete cascade
);
create index if not exists progreso_tenant_curso_alumno_idx on progreso (tenant_id, curso_id, alumno_id);
create index if not exists progreso_tenant_leccion_idx on progreso (tenant_id, leccion_id);

-- ---------------------------------------------------------------------------
-- eventos: registro append-only de eventos de producto (RQ-26)
-- Sin IP ni datos personales extra. Sin update/delete para clientes.
-- ---------------------------------------------------------------------------
create table if not exists eventos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  curso_id uuid,
  alumno_id uuid references auth.users(id) on delete set null,
  tipo text not null check (tipo in (
    'inscripcion', 'leccion_abierta', 'leccion_completada',
    'intento_quiz', 'curso_completado', 'correo_abierto', 'correo_clic'
  )),
  entidad_tipo text check (entidad_tipo in ('curso', 'leccion', 'quiz', 'correo')),
  entidad_id uuid,
  created_at timestamptz not null default now(),
  foreign key (curso_id, tenant_id) references cursos (id, tenant_id) on delete cascade
);
create index if not exists eventos_tenant_created_idx on eventos (tenant_id, created_at desc);
create index if not exists eventos_tenant_tipo_idx on eventos (tenant_id, tipo, created_at desc);
create index if not exists eventos_tenant_curso_idx on eventos (tenant_id, curso_id);

-- ---------------------------------------------------------------------------
-- RLS
-- Creador (miembro del tenant): ve y gestiona las filas de su tenant.
-- Alumno: ve las suyas; escribe progreso/eventos propios solo con inscripcion
-- activa. La inscripcion la crea el servidor (RQ-14, tras definir Q1); por
-- ahora el alumno no inserta/actualiza/borra inscripciones directamente.
-- ---------------------------------------------------------------------------
alter table inscripciones enable row level security;
alter table progreso enable row level security;
alter table eventos enable row level security;

-- inscripciones
drop policy if exists inscripciones_select on inscripciones;
create policy inscripciones_select on inscripciones
  for select using (tenant_id = auth_tenant_id() or alumno_id = auth.uid());
drop policy if exists inscripciones_insert_por_tenant on inscripciones;
create policy inscripciones_insert_por_tenant on inscripciones
  for insert with check (tenant_id = auth_tenant_id());
drop policy if exists inscripciones_update_por_tenant on inscripciones;
create policy inscripciones_update_por_tenant on inscripciones
  for update using (tenant_id = auth_tenant_id()) with check (tenant_id = auth_tenant_id());
drop policy if exists inscripciones_delete_por_tenant on inscripciones;
create policy inscripciones_delete_por_tenant on inscripciones
  for delete using (tenant_id = auth_tenant_id());

-- progreso
drop policy if exists progreso_select on progreso;
create policy progreso_select on progreso
  for select using (tenant_id = auth_tenant_id() or alumno_id = auth.uid());
drop policy if exists progreso_insert_alumno on progreso;
create policy progreso_insert_alumno on progreso
  for insert with check (
    alumno_id = auth.uid()
    and exists (
      select 1 from inscripciones i
      where i.alumno_id = auth.uid()
        and i.curso_id = progreso.curso_id
        and i.tenant_id = progreso.tenant_id
        and i.estado = 'activa'
    )
  );
drop policy if exists progreso_update_alumno on progreso;
create policy progreso_update_alumno on progreso
  for update using (alumno_id = auth.uid())
  with check (
    alumno_id = auth.uid()
    and exists (
      select 1 from inscripciones i
      where i.alumno_id = auth.uid()
        and i.curso_id = progreso.curso_id
        and i.tenant_id = progreso.tenant_id
        and i.estado = 'activa'
    )
  );
drop policy if exists progreso_delete_por_tenant on progreso;
create policy progreso_delete_por_tenant on progreso
  for delete using (tenant_id = auth_tenant_id());

-- eventos (append-only: sin politicas de update ni delete)
drop policy if exists eventos_select_por_tenant on eventos;
create policy eventos_select_por_tenant on eventos
  for select using (tenant_id = auth_tenant_id());
drop policy if exists eventos_insert on eventos;
create policy eventos_insert on eventos
  for insert with check (
    tenant_id = auth_tenant_id()
    or (
      alumno_id = auth.uid()
      and exists (
        select 1 from inscripciones i
        where i.alumno_id = auth.uid()
          and i.tenant_id = eventos.tenant_id
          and i.estado = 'activa'
      )
    )
  );

-- ---------------------------------------------------------------------------
-- Privilegios minimos
-- ---------------------------------------------------------------------------
revoke all on inscripciones, progreso, eventos from anon;
revoke all on inscripciones, progreso, eventos from authenticated;
grant select, insert, update, delete on inscripciones, progreso to authenticated;
grant select, insert on eventos to authenticated;
grant select, insert, update, delete on inscripciones, progreso, eventos to service_role;

-- ===========================================================================
-- 0004_postulaciones (ADR 011)
-- ===========================================================================

create table if not exists postulaciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Copiado de auth.users por trigger: nunca viene del cliente.
  email text not null,
  nombre text not null,
  url text,
  alumnos text,
  estado text not null default 'nueva',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Una postulacion por cuenta.
create unique index if not exists postulaciones_user_id_key on postulaciones (user_id);
create index if not exists postulaciones_estado_created_idx on postulaciones (estado, created_at desc);

alter table postulaciones drop constraint if exists postulaciones_nombre_check;
alter table postulaciones add constraint postulaciones_nombre_check
  check (char_length(btrim(nombre)) between 1 and 80);
alter table postulaciones drop constraint if exists postulaciones_url_check;
alter table postulaciones add constraint postulaciones_url_check
  check (url is null or char_length(url) <= 300);
alter table postulaciones drop constraint if exists postulaciones_alumnos_check;
alter table postulaciones add constraint postulaciones_alumnos_check
  check (alumnos is null or alumnos in ('lt30', '30-100', '100-300', 'gt300'));
alter table postulaciones drop constraint if exists postulaciones_estado_check;
alter table postulaciones add constraint postulaciones_estado_check
  check (estado in ('nueva', 'contactada', 'aceptada', 'lista_espera', 'descartada'));

-- Correo autoritativo (el de la cuenta de Google) y updated_at.
create or replace function postulaciones_completar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select u.email into new.email from auth.users u where u.id = new.user_id;
  if new.email is null then
    raise exception 'postulaciones: el usuario no tiene correo';
  end if;
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists postulaciones_completar on postulaciones;
create trigger postulaciones_completar before insert or update on postulaciones
  for each row execute function postulaciones_completar();

-- ---------------------------------------------------------------------------
-- RLS: solo la propia fila. Se puede editar mientras siga 'nueva'.
-- ---------------------------------------------------------------------------
alter table postulaciones enable row level security;

drop policy if exists postulaciones_select_propia on postulaciones;
create policy postulaciones_select_propia on postulaciones
  for select using (user_id = auth.uid());

drop policy if exists postulaciones_insert_propia on postulaciones;
create policy postulaciones_insert_propia on postulaciones
  for insert with check (user_id = auth.uid() and estado = 'nueva');

drop policy if exists postulaciones_update_propia on postulaciones;
create policy postulaciones_update_propia on postulaciones
  for update using (user_id = auth.uid() and estado = 'nueva')
  with check (user_id = auth.uid() and estado = 'nueva');

-- Privilegios minimos: el cliente solo escribe sus campos (ni estado ni email).
revoke all on postulaciones from anon, authenticated;
grant select on postulaciones to authenticated;
grant insert (user_id, nombre, url, alumnos) on postulaciones to authenticated;
grant update (nombre, url, alumnos) on postulaciones to authenticated;
grant all on postulaciones to service_role;
revoke all on function postulaciones_completar() from public, anon, authenticated;


-- ===========================================================================
-- 0005_postulacion_sin_cuenta (ADR 014)
-- ===========================================================================

alter table postulaciones alter column user_id drop not null;
alter table postulaciones add column if not exists descripcion text;
alter table postulaciones add column if not exists invitado_en timestamptz;

alter table postulaciones drop constraint if exists postulaciones_descripcion_check;
alter table postulaciones add constraint postulaciones_descripcion_check
  check (descripcion is null or char_length(descripcion) <= 600);

-- Una postulacion por correo (sin distinguir mayusculas).
create unique index if not exists postulaciones_email_key on postulaciones (lower(email));

-- Con user_id el correo sale de auth.users (via antigua); sin user_id viene del
-- servidor. Siempre en minusculas y sin espacios.
create or replace function postulaciones_completar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_id is not null then
    select u.email into new.email from auth.users u where u.id = new.user_id;
  end if;
  new.email = lower(btrim(new.email));
  if new.email is null or new.email = '' then
    raise exception 'postulaciones: falta el correo';
  end if;
  new.updated_at = now();
  return new;
end;
$$;


-- ===========================================================================
-- 0006_staff_y_acceso_crear_academia (ADR 016)
-- ===========================================================================

create table if not exists staff (
  email text primary key,
  rol text not null default 'admin',
  created_at timestamptz not null default now(),
  created_by text
);

alter table staff drop constraint if exists staff_email_check;
alter table staff add constraint staff_email_check check (email = lower(btrim(email)) and email <> '');
alter table staff drop constraint if exists staff_rol_check;
alter table staff add constraint staff_rol_check check (rol in ('admin'));

-- RLS sin politicas: ningun cliente (anon/authenticated) la toca.
alter table staff enable row level security;
revoke all on staff from anon, authenticated;
grant all on staff to service_role;

-- ¿Este correo puede usar la plataforma? Staff o postulacion aceptada.
create or replace function tiene_acceso_plataforma(p_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from staff where email = lower(btrim(p_email)))
      or exists (select 1 from postulaciones where lower(email) = lower(btrim(p_email)) and estado = 'aceptada')
$$;

-- Solo la usan funciones security definer (crear_academia) y el service role.
revoke execute on function tiene_acceso_plataforma(text) from public, anon, authenticated;

-- crear_academia: igual que 0002 + exige acceso (error estable `sin_invitacion`).
create or replace function crear_academia(
  p_nombre text,
  p_subdomain text,
  p_frase text default null,
  p_area text default null
)
returns tenants
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_nombre text := btrim(coalesce(p_nombre, ''));
  v_sub text := lower(btrim(coalesce(p_subdomain, '')));
  v_frase text := nullif(btrim(coalesce(p_frase, '')), '');
  v_area text := nullif(btrim(coalesce(p_area, '')), '');
  v_email text;
  v_err text;
  v_tenant tenants;
  v_constraint text;
begin
  if v_uid is null then
    raise exception 'no_autenticado' using errcode = '28000';
  end if;

  select u.email into v_email from auth.users u where u.id = v_uid;
  if not tiene_acceso_plataforma(v_email) then
    raise exception 'sin_invitacion' using errcode = '42501';
  end if;

  if char_length(v_nombre) not between 2 and 60
     or char_length(coalesce(v_frase, '')) > 100
     or char_length(coalesce(v_area, '')) > 60 then
    raise exception 'nombre_invalido' using errcode = '22023';
  end if;

  v_err := subdominio_error(v_sub);
  if v_err is not null then
    raise exception '%', v_err using errcode = '22023';
  end if;

  -- Serializa altas concurrentes del MISMO usuario (doble clic, dos pestanas).
  perform pg_advisory_xact_lock(hashtextextended('crear_academia:' || v_uid::text, 0));

  if exists (select 1 from membresias where user_id = v_uid) then
    raise exception 'ya_tiene_academia' using errcode = 'P0001';
  end if;

  begin
    insert into tenants (slug, subdomain, nombre, frase, area, color_primario, logo_modo)
    values (v_sub, v_sub, v_nombre, v_frase, v_area, '#2563eb', 'logo_y_nombre')
    returning * into v_tenant;

    insert into membresias (user_id, tenant_id, rol)
    values (v_uid, v_tenant.id, 'dueno');
  exception
    when unique_violation then
      get stacked diagnostics v_constraint = constraint_name;
      if v_constraint like 'membresias%' then
        raise exception 'ya_tiene_academia' using errcode = 'P0001';
      end if;
      raise exception 'subdominio_tomado' using errcode = '23505';
  end;

  return v_tenant;
end
$$;

revoke execute on function crear_academia(text, text, text, text) from public, anon;
grant execute on function crear_academia(text, text, text, text) to authenticated;


-- ===========================================================================
-- 0007_alumnos_por_tenant (ADR 018)
-- ===========================================================================
-- ADR 018 (Propuesta): cuentas de alumno propias de cada academia, fuera de
-- auth.users. Reemplaza el supuesto de 0003 (alumno_id -> auth.users) y agrega
-- el ciclo de inscripcion del diseno "05 Experiencia del estudiante":
-- pendiente -> activa | rechazada | vencida, origen/campana, pagos manuales.
-- NO aplicada a ninguna base remota. Idempotente donde es razonable.
--
-- Requisitos previos: 0003 aplicada. Las tablas inscripciones/progreso/eventos
-- deben estar SIN filas de alumnos (nunca hubo flujo que las creara); si las
-- hubiera, esta migracion se detiene para no perder datos.
--
-- Acceso: las tablas de alumno las lee/escribe SOLO el backend con service
-- role (la sesion del alumno no es de Supabase Auth). RLS queda habilitada con
-- politicas solo para el creador (miembro del tenant), como defensa extra.

-- ---------------------------------------------------------------------------
-- Guarda: no migrar si ya hay datos de alumnos atados a auth.users
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'inscripciones' and column_name = 'alumno_id')
     and not exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'alumnos') then
    if exists (select 1 from inscripciones) or exists (select 1 from progreso)
       or exists (select 1 from eventos where alumno_id is not null) then
      raise exception 'inscripciones/progreso/eventos tienen filas atadas a auth.users: migrar a mano antes de aplicar 0007';
    end if;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- alumnos: una cuenta por (academia, correo)
-- ---------------------------------------------------------------------------
create table if not exists alumnos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  nombre text not null check (char_length(btrim(nombre)) between 1 and 120),
  correo text not null check (correo = lower(correo) and char_length(correo) <= 254),
  -- scrypt$N$r$p$salt_b64$hash_b64 (ver lib/alumno/password.ts). Nunca en claro.
  password_hash text not null,
  consentimiento_at timestamptz not null default now(),
  correo_verificado_at timestamptz,
  ultimo_ingreso_at timestamptz,
  created_at timestamptz not null default now(),
  unique (tenant_id, correo),
  unique (id, tenant_id)
);
create index if not exists alumnos_tenant_created_idx on alumnos (tenant_id, created_at desc);

-- ---------------------------------------------------------------------------
-- alumno_tokens: sesiones y enlaces de un solo uso (confirmar correo,
-- recuperar contrasena). Solo se guarda el hash SHA-256 del token.
-- ---------------------------------------------------------------------------
create table if not exists alumno_tokens (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  alumno_id uuid not null,
  tipo text not null check (tipo in ('sesion', 'confirmar', 'recuperar')),
  token_hash text not null unique,
  expira_at timestamptz not null,
  usado_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (alumno_id, tenant_id) references alumnos (id, tenant_id) on delete cascade
);
create index if not exists alumno_tokens_tenant_alumno_idx on alumno_tokens (tenant_id, alumno_id, tipo);
create index if not exists alumno_tokens_expira_idx on alumno_tokens (tenant_id, expira_at);

-- ---------------------------------------------------------------------------
-- inscripciones: de auth.users a alumnos + ciclo de estados del diseno
-- ---------------------------------------------------------------------------
alter table inscripciones drop constraint if exists inscripciones_alumno_id_fkey;
alter table inscripciones drop constraint if exists inscripciones_curso_id_alumno_id_key;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'inscripciones_alumno_tenant_fkey') then
    alter table inscripciones
      add constraint inscripciones_alumno_tenant_fkey
      foreign key (alumno_id, tenant_id) references alumnos (id, tenant_id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'inscripciones_curso_alumno_key') then
    alter table inscripciones add constraint inscripciones_curso_alumno_key unique (curso_id, alumno_id);
  end if;
end $$;

alter table inscripciones drop constraint if exists inscripciones_estado_check;
alter table inscripciones add constraint inscripciones_estado_check
  check (estado in ('pendiente', 'activa', 'rechazada', 'vencida', 'cancelada'));
alter table inscripciones alter column estado set default 'pendiente';

alter table inscripciones add column if not exists origen text not null default 'pagina';
alter table inscripciones drop constraint if exists inscripciones_origen_check;
alter table inscripciones add constraint inscripciones_origen_check
  check (origen in ('invitacion', 'anuncio', 'pagina'));
alter table inscripciones add column if not exists campana text;
alter table inscripciones drop constraint if exists inscripciones_campana_check;
alter table inscripciones add constraint inscripciones_campana_check
  check (campana is null or char_length(campana) <= 120);
alter table inscripciones add column if not exists activada_por text;
alter table inscripciones drop constraint if exists inscripciones_activada_por_check;
alter table inscripciones add constraint inscripciones_activada_por_check
  check (activada_por is null or activada_por in ('creador', 'pago', 'invitacion'));
alter table inscripciones add column if not exists activada_en timestamptz;

-- ---------------------------------------------------------------------------
-- pagos: registro del pago de una inscripcion (manual hoy, pasarela despues)
-- ---------------------------------------------------------------------------
create table if not exists pagos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  inscripcion_id uuid not null,
  monto_centavos integer not null default 0 check (monto_centavos >= 0),
  medio text not null check (medio in ('transferencia', 'factura', 'sin_costo', 'pasarela')),
  registrado_por text not null default 'creador' check (registrado_por in ('creador', 'pasarela')),
  referencia_externa text,
  created_at timestamptz not null default now(),
  foreign key (inscripcion_id, tenant_id) references inscripciones (id, tenant_id) on delete cascade
);
create index if not exists pagos_tenant_inscripcion_idx on pagos (tenant_id, inscripcion_id);

-- ---------------------------------------------------------------------------
-- progreso y eventos: alumno_id pasa a alumnos
-- ---------------------------------------------------------------------------
alter table progreso drop constraint if exists progreso_alumno_id_fkey;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'progreso_alumno_tenant_fkey') then
    alter table progreso
      add constraint progreso_alumno_tenant_fkey
      foreign key (alumno_id, tenant_id) references alumnos (id, tenant_id) on delete cascade;
  end if;
end $$;

alter table eventos drop constraint if exists eventos_alumno_id_fkey;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'eventos_alumno_tenant_fkey') then
    -- SET NULL solo de alumno_id (tenant_id es NOT NULL y no puede anularse).
    alter table eventos
      add constraint eventos_alumno_tenant_fkey
      foreign key (alumno_id, tenant_id) references alumnos (id, tenant_id) on delete set null (alumno_id);
  end if;
end $$;

alter table eventos drop constraint if exists eventos_tipo_check;
alter table eventos add constraint eventos_tipo_check check (tipo in (
  'inscripcion', 'leccion_abierta', 'leccion_completada',
  'intento_quiz', 'curso_completado', 'correo_abierto', 'correo_clic',
  'cuenta_creada', 'inscripcion_creada', 'inscripcion_activada',
  'pago_registrado', 'inscripcion_rechazada'
));

-- ---------------------------------------------------------------------------
-- RLS: el creador ve/gestiona lo de su tenant; el alumno NO entra por
-- PostgREST (no tiene JWT de Supabase). alumnos: el creador la lee con su
-- sesion (RLS) pero SIN password_hash (grant por columnas). alumno_tokens:
-- sin acceso para clientes.
-- ---------------------------------------------------------------------------
alter table alumnos enable row level security;
alter table alumno_tokens enable row level security;
alter table pagos enable row level security;

-- Las politicas "de alumno" de 0003 ya no aplican (auth.uid() no es alumno).
drop policy if exists inscripciones_select on inscripciones;
create policy inscripciones_select on inscripciones
  for select using (tenant_id = auth_tenant_id());

drop policy if exists progreso_select on progreso;
create policy progreso_select on progreso
  for select using (tenant_id = auth_tenant_id());
drop policy if exists progreso_insert_alumno on progreso;
drop policy if exists progreso_update_alumno on progreso;

drop policy if exists eventos_insert on eventos;
create policy eventos_insert on eventos
  for insert with check (tenant_id = auth_tenant_id());

drop policy if exists alumnos_select_por_tenant on alumnos;
create policy alumnos_select_por_tenant on alumnos
  for select using (tenant_id = auth_tenant_id());

drop policy if exists pagos_select_por_tenant on pagos;
create policy pagos_select_por_tenant on pagos
  for select using (tenant_id = auth_tenant_id());
drop policy if exists pagos_insert_por_tenant on pagos;
create policy pagos_insert_por_tenant on pagos
  for insert with check (tenant_id = auth_tenant_id());

-- ---------------------------------------------------------------------------
-- Privilegios minimos
-- ---------------------------------------------------------------------------
revoke all on alumnos, alumno_tokens, pagos from anon, authenticated;
grant select, insert on pagos to authenticated;
grant select (id, tenant_id, nombre, correo, consentimiento_at, correo_verificado_at, ultimo_ingreso_at, created_at)
  on alumnos to authenticated;
grant select, insert, update, delete on alumnos, alumno_tokens, pagos to service_role;


-- ===========================================================================
-- 0008_pagina_academia (ADR 021)
-- ===========================================================================
-- Pagina publica de la academia (ADR 021): template elegido, contenido en
-- borrador, foto de portada, testimonios reales y la version publicada que ve
-- el sitio publico. Ademas, la solicitud de dominio propio (concierge, RQ-30).
-- Una fila por academia (tenant_id es la clave primaria).
-- Idempotente (if not exists / drop ... if exists).

create table if not exists paginas_academia (
  tenant_id uuid primary key references tenants(id) on delete cascade,

  -- Borrador (lo que edita el creador; el sitio publico NO lo lee).
  template text check (template in ('programa', 'maestro', 'consultor')),
  titulo text check (titulo is null or char_length(titulo) between 1 and 90),
  bajada text check (bajada is null or char_length(bajada) between 1 and 240),
  foto_url text check (foto_url is null or foto_url ~ '^https://'),
  accion text not null default 'inscribirme' check (accion in ('inscribirme', 'conversacion')),
  -- Cursos publicados que el creador decidio NO mostrar (los nuevos se muestran por defecto).
  cursos_ocultos uuid[] not null default '{}',
  bio_nombre text check (bio_nombre is null or char_length(bio_nombre) between 1 and 80),
  bio_texto text check (bio_texto is null or char_length(bio_texto) between 1 and 400),
  -- [{ "nombre": "Nombre y cargo", "texto": "...", "autorizado_at": "..." }], maximo 6.
  testimonios jsonb not null default '[]'::jsonb
    check (jsonb_typeof(testimonios) = 'array' and jsonb_array_length(testimonios) <= 6),
  -- true cuando el creador quito los testimonios y cifras de ejemplo del template.
  ejemplo_testimonios_quitado boolean not null default false,

  -- Version publicada: copia del borrador al presionar "Publicar" (el sitio publico lee esto).
  publicado jsonb check (publicado is null or jsonb_typeof(publicado) = 'object'),
  publicada_at timestamptz,

  -- Dominio propio pedido por el creador; el equipo lo conecta a mano (RQ-30) y
  -- recien ahi llena tenants.custom_domain.
  dominio_solicitado text check (
    dominio_solicitado is null
    or (dominio_solicitado = lower(dominio_solicitado) and char_length(dominio_solicitado) <= 253)
  ),
  dominio_token text check (dominio_token is null or dominio_token ~ '^[a-f0-9]{24}$'),
  dominio_solicitado_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists paginas_academia_set_updated_at on paginas_academia;
create trigger paginas_academia_set_updated_at before update on paginas_academia
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: solo el creador de la academia lee y escribe su pagina. El sitio
-- publico lee la columna `publicado` desde el servidor (lib/sitio/paginaPublica.ts,
-- lista blanca de admin.ts), siempre filtrando por tenant_id.
-- ---------------------------------------------------------------------------
alter table paginas_academia enable row level security;

drop policy if exists paginas_academia_select_por_tenant on paginas_academia;
create policy paginas_academia_select_por_tenant on paginas_academia
  for select using (tenant_id = auth_tenant_id());
drop policy if exists paginas_academia_insert_por_tenant on paginas_academia;
create policy paginas_academia_insert_por_tenant on paginas_academia
  for insert with check (tenant_id = auth_tenant_id());
drop policy if exists paginas_academia_update_por_tenant on paginas_academia;
create policy paginas_academia_update_por_tenant on paginas_academia
  for update using (tenant_id = auth_tenant_id()) with check (tenant_id = auth_tenant_id());
drop policy if exists paginas_academia_delete_por_tenant on paginas_academia;
create policy paginas_academia_delete_por_tenant on paginas_academia
  for delete using (tenant_id = auth_tenant_id());

-- El rol anon (visitantes del sitio) no tiene acceso directo.
revoke all on paginas_academia from anon, authenticated;
grant select, insert, update, delete on paginas_academia to authenticated;
grant select, insert, update, delete on paginas_academia to service_role;


-- ===========================================================================
-- 0009_quiz_repaso (ADR 022)
-- ===========================================================================

create table if not exists quiz_preguntas (
  id uuid primary key,
  tenant_id uuid not null references tenants(id) on delete cascade,
  curso_id uuid not null,
  modulo_id uuid not null,
  orden integer not null default 0 check (orden between 0 and 99),
  tipo text not null default 'opcion_multiple' check (tipo in ('opcion_multiple', 'verdadero_falso')),
  -- El borrador puede quedar incompleto; las reglas de publicacion exigen texto y correcta.
  texto text not null default '' check (char_length(texto) <= 300),
  -- Arreglo de 2 a 4 textos (verdadero/falso: ["Verdadero", "Falso"]).
  opciones jsonb not null default '[]'::jsonb
    check (jsonb_typeof(opciones) = 'array' and jsonb_array_length(opciones) between 2 and 4),
  -- Indice (0..3) de la opcion correcta; null mientras el creador no la marca.
  correcta smallint check (correcta is null or correcta between 0 and 3),
  explicacion text not null default '' check (char_length(explicacion) <= 400),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (curso_id, tenant_id) references cursos (id, tenant_id) on delete cascade,
  foreign key (modulo_id, tenant_id) references modulos (id, tenant_id) on delete cascade
);
create index if not exists quiz_preguntas_tenant_modulo_idx on quiz_preguntas (tenant_id, modulo_id, orden);
create index if not exists quiz_preguntas_tenant_curso_idx on quiz_preguntas (tenant_id, curso_id);

drop trigger if exists quiz_preguntas_set_updated_at on quiz_preguntas;
create trigger quiz_preguntas_set_updated_at before update on quiz_preguntas
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: solo el creador de la academia lee y escribe sus preguntas. El alumno
-- NUNCA lee esta tabla directo (traeria la respuesta correcta): cuando exista
-- el quiz del estudiante, el servidor le enviara las preguntas sin `correcta`.
-- ---------------------------------------------------------------------------
alter table quiz_preguntas enable row level security;

drop policy if exists quiz_preguntas_select_por_tenant on quiz_preguntas;
create policy quiz_preguntas_select_por_tenant on quiz_preguntas
  for select using (tenant_id = auth_tenant_id());
drop policy if exists quiz_preguntas_insert_por_tenant on quiz_preguntas;
create policy quiz_preguntas_insert_por_tenant on quiz_preguntas
  for insert with check (tenant_id = auth_tenant_id());
drop policy if exists quiz_preguntas_update_por_tenant on quiz_preguntas;
create policy quiz_preguntas_update_por_tenant on quiz_preguntas
  for update using (tenant_id = auth_tenant_id()) with check (tenant_id = auth_tenant_id());
drop policy if exists quiz_preguntas_delete_por_tenant on quiz_preguntas;
create policy quiz_preguntas_delete_por_tenant on quiz_preguntas
  for delete using (tenant_id = auth_tenant_id());

revoke all on quiz_preguntas from anon, authenticated;
grant select, insert, update, delete on quiz_preguntas to authenticated;
grant select, insert, update, delete on quiz_preguntas to service_role;

-- ---------------------------------------------------------------------------
-- 0011_quiz_respuestas (ADR 023)
-- ---------------------------------------------------------------------------

create table if not exists quiz_respuestas (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  curso_id uuid not null,
  modulo_id uuid not null,
  alumno_id uuid not null,
  pregunta_id uuid not null references quiz_preguntas(id) on delete cascade,
  opcion smallint not null check (opcion between 0 and 3),
  acierto boolean not null,
  -- true solo en la primera respuesta de ese alumno a esa pregunta (da XP de acierto).
  primer_intento boolean not null default false,
  created_at timestamptz not null default now(),
  foreign key (curso_id, tenant_id) references cursos (id, tenant_id) on delete cascade,
  foreign key (modulo_id, tenant_id) references modulos (id, tenant_id) on delete cascade,
  foreign key (alumno_id, tenant_id) references alumnos (id, tenant_id) on delete cascade
);
create index if not exists quiz_respuestas_tenant_alumno_curso_idx on quiz_respuestas (tenant_id, alumno_id, curso_id);
create index if not exists quiz_respuestas_tenant_modulo_idx on quiz_respuestas (tenant_id, modulo_id);
create index if not exists quiz_respuestas_tenant_pregunta_idx on quiz_respuestas (tenant_id, pregunta_id);

alter table quiz_respuestas enable row level security;

drop policy if exists quiz_respuestas_select_por_tenant on quiz_respuestas;
create policy quiz_respuestas_select_por_tenant on quiz_respuestas
  for select using (tenant_id = auth_tenant_id());

revoke all on quiz_respuestas from anon, authenticated;
grant select on quiz_respuestas to authenticated;
grant select, insert, update, delete on quiz_respuestas to service_role;
