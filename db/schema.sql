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

-- Ejemplo de política RLS: un usuario solo puede ver cursos de su propio
-- tenant. La función auth_tenant_id() debe resolver el tenant del usuario
-- autenticado (via una tabla de membresías profesor <-> tenant).
create policy cursos_select_por_tenant on cursos
  for select
  using (tenant_id = auth_tenant_id());
