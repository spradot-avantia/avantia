-- 0007_alumnos_por_tenant.sql
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
