-- 0015_modulos_enriquecidos.sql
-- Módulos enriquecidos (ADR 029, F1): presentación del módulo y datos de la lección.
-- Son columnas opcionales de tablas que ya tienen tenant_id, RLS e índices por tenant:
-- no hay tablas nuevas (los materiales llegan con la F2, migración 0016). Idempotente.

alter table modulos
  add column if not exists descripcion text,
  add column if not exists objetivos text[] not null default '{}',
  add column if not exists duracion_min integer;

alter table lecciones
  add column if not exists descripcion text,
  add column if not exists duracion_min integer;

alter table modulos drop constraint if exists modulos_descripcion_check;
alter table modulos add constraint modulos_descripcion_check
  check (descripcion is null or char_length(descripcion) <= 600);
alter table modulos drop constraint if exists modulos_objetivos_check;
alter table modulos add constraint modulos_objetivos_check
  check (cardinality(objetivos) <= 4);
alter table modulos drop constraint if exists modulos_duracion_check;
alter table modulos add constraint modulos_duracion_check
  check (duracion_min is null or duracion_min between 1 and 1440);

alter table lecciones drop constraint if exists lecciones_descripcion_check;
alter table lecciones add constraint lecciones_descripcion_check
  check (descripcion is null or char_length(descripcion) <= 400);
alter table lecciones drop constraint if exists lecciones_duracion_check;
alter table lecciones add constraint lecciones_duracion_check
  check (duracion_min is null or duracion_min between 1 and 1440);
