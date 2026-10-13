-- 0003_inscripciones_progreso_eventos.sql
-- Cimientos de la experiencia del alumno (RQ-14, RQ-16, RQ-22, RQ-26) y
-- cohorte simple (ADR 004): inscripciones, progreso, eventos y
-- lecciones.dia_liberacion. NO aplicada a ninguna base remota.
-- alumno_id referencia auth.users(id); la decision de identidad del alumno
-- (Q1, ADR pendiente) define como se crea esa cuenta, no este esquema.
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
