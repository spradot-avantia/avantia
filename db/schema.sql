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
alter table cursos drop constraint if exists cursos_id_tenant_id_key;
alter table cursos add constraint cursos_id_tenant_id_key unique (id, tenant_id);

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
