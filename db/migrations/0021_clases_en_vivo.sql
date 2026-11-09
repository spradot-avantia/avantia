-- 0021_clases_en_vivo.sql
-- Clases en vivo, Fase 1 (ADR 039): fecha, enlace de Meet pegado a mano, grabación y resumen.
-- Idempotente. Aislamiento por tenant: tenant_id, RLS en las 4 operaciones, índice compuesto
-- que empieza por tenant_id y clave foránea compuesta (curso + tenant). Los alumnos leen con
-- service_role desde el servidor (ADR 018), tras comprobar inscripción activa.

create table if not exists clases_en_vivo (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  curso_id uuid not null,
  titulo text not null check (char_length(btrim(titulo)) between 1 and 120),
  descripcion text not null default '' check (char_length(descripcion) <= 2000),
  inicia_at timestamptz not null,
  duracion_min integer not null default 60 check (duracion_min between 5 and 600),
  enlace_meet text check (enlace_meet is null or (enlace_meet ~ '^https://' and char_length(enlace_meet) <= 2000)),
  grabacion_url text check (grabacion_url is null or (grabacion_url ~ '^https://' and char_length(grabacion_url) <= 2000)),
  -- Qué se vio (texto enriquecido, admite LaTeX).
  resumen text not null default '' check (char_length(resumen) <= 20000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (curso_id, tenant_id) references cursos (id, tenant_id) on delete cascade
);
create index if not exists clases_en_vivo_tenant_curso_inicia_idx on clases_en_vivo (tenant_id, curso_id, inicia_at);

drop trigger if exists clases_en_vivo_set_updated_at on clases_en_vivo;
create trigger clases_en_vivo_set_updated_at before update on clases_en_vivo
  for each row execute function set_updated_at();

alter table clases_en_vivo enable row level security;
drop policy if exists clases_en_vivo_select_por_tenant on clases_en_vivo;
create policy clases_en_vivo_select_por_tenant on clases_en_vivo for select using (tenant_id = auth_tenant_id());
drop policy if exists clases_en_vivo_insert_por_tenant on clases_en_vivo;
create policy clases_en_vivo_insert_por_tenant on clases_en_vivo for insert with check (tenant_id = auth_tenant_id());
drop policy if exists clases_en_vivo_update_por_tenant on clases_en_vivo;
create policy clases_en_vivo_update_por_tenant on clases_en_vivo
  for update using (tenant_id = auth_tenant_id()) with check (tenant_id = auth_tenant_id());
drop policy if exists clases_en_vivo_delete_por_tenant on clases_en_vivo;
create policy clases_en_vivo_delete_por_tenant on clases_en_vivo for delete using (tenant_id = auth_tenant_id());

revoke all on clases_en_vivo from anon;
grant select, insert, update, delete on clases_en_vivo to authenticated;
grant select, insert, update, delete on clases_en_vivo to service_role;
