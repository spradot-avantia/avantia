-- 0009_quiz_repaso.sql
-- Quiz de repaso por modulo (ADR 022, RQ-17): el creador escribe de 3 a 5
-- preguntas por modulo (opcion multiple o verdadero/falso) con la respuesta
-- correcta y una explicacion. Solo el lado del creador (diseno 03, pantalla
-- 3.3); responder, XP y repaso espaciado llegan con la experiencia del
-- estudiante (diseno 05). Idempotente (if not exists / drop ... if exists).
--
-- No hay tabla "quizzes": el quiz de un modulo es el conjunto de sus preguntas.
-- El id de cada pregunta lo genera el editor (uuid) y se conserva al editar,
-- asi los intentos futuros del estudiante pueden apuntar a la pregunta.

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