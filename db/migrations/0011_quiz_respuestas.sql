-- 0011_quiz_respuestas.sql
-- Respuestas del estudiante al quiz de repaso por modulo (ADR 023, RQ-17).
-- Una fila por respuesta. La correccion y el XP se derivan de estas filas.
-- Escribe SOLO el servidor (service role) tras validar inscripcion activa; el
-- estudiante no tiene acceso directo. El creador lee las de su academia.
-- Idempotente.

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
