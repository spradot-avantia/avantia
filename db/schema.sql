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
