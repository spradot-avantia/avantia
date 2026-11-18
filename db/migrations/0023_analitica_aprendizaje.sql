-- 0023_analitica_aprendizaje.sql
-- Analítica de aprendizaje para el creador (ADR 040). Idempotente.
--  1) sesiones_leccion: tiempo ACTIVO del alumno en cada visita a una lección (dato propio, no
--     depende de cookies de terceros). Una fila por visita (visita_id lo genera el navegador).
--  2) quiz_respuestas.duracion_ms: tiempo que tardó en responder cada pregunta.
-- Aislamiento por tenant: tenant_id, RLS (lectura del creador), índice compuesto que empieza por
-- tenant_id y claves foráneas compuestas. La escritura es solo del servidor (service_role).

create table if not exists sesiones_leccion (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  curso_id uuid not null,
  leccion_id uuid not null,
  alumno_id uuid not null,
  visita_id uuid not null,
  activo_seg integer not null default 0 check (activo_seg between 0 and 3600),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, visita_id),
  foreign key (curso_id, tenant_id) references cursos (id, tenant_id) on delete cascade,
  foreign key (alumno_id, tenant_id) references alumnos (id, tenant_id) on delete cascade
);
create index if not exists sesiones_leccion_tenant_curso_leccion_idx on sesiones_leccion (tenant_id, curso_id, leccion_id);
create index if not exists sesiones_leccion_tenant_alumno_idx on sesiones_leccion (tenant_id, alumno_id, created_at desc);

drop trigger if exists sesiones_leccion_set_updated_at on sesiones_leccion;
create trigger sesiones_leccion_set_updated_at before update on sesiones_leccion
  for each row execute function set_updated_at();

alter table sesiones_leccion enable row level security;
drop policy if exists sesiones_leccion_select_por_tenant on sesiones_leccion;
create policy sesiones_leccion_select_por_tenant on sesiones_leccion
  for select using (tenant_id = auth_tenant_id());

revoke all on sesiones_leccion from anon, authenticated;
grant select on sesiones_leccion to authenticated;
grant select, insert, update, delete on sesiones_leccion to service_role;

alter table quiz_respuestas add column if not exists duracion_ms integer
  check (duracion_ms is null or duracion_ms between 0 and 600000);
