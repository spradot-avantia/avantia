-- 0004_postulaciones.sql
-- Postulaciones al programa fundador (RQ-28, ADR 011). NO aplicada a ninguna
-- base remota (se pega en el SQL Editor de Supabase). Idempotente.
--
-- Tabla de PLATAFORMA, no de academia: el postulante todavia no tiene tenant,
-- por eso no lleva tenant_id (excepcion documentada en ADR 011 y en
-- Supuestos_y_Pendientes). El aislamiento es por usuario: cada cuenta (Google)
-- ve y edita solo su postulacion; el equipo de Avantia la lee con service role
-- desde /admin/postulaciones.

create table if not exists postulaciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Copiado de auth.users por trigger: nunca viene del cliente.
  email text not null,
  nombre text not null,
  url text,
  alumnos text,
  estado text not null default 'nueva',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Una postulacion por cuenta.
create unique index if not exists postulaciones_user_id_key on postulaciones (user_id);
create index if not exists postulaciones_estado_created_idx on postulaciones (estado, created_at desc);

alter table postulaciones drop constraint if exists postulaciones_nombre_check;
alter table postulaciones add constraint postulaciones_nombre_check
  check (char_length(btrim(nombre)) between 1 and 80);
alter table postulaciones drop constraint if exists postulaciones_url_check;
alter table postulaciones add constraint postulaciones_url_check
  check (url is null or char_length(url) <= 300);
alter table postulaciones drop constraint if exists postulaciones_alumnos_check;
alter table postulaciones add constraint postulaciones_alumnos_check
  check (alumnos is null or alumnos in ('lt30', '30-100', '100-300', 'gt300'));
alter table postulaciones drop constraint if exists postulaciones_estado_check;
alter table postulaciones add constraint postulaciones_estado_check
  check (estado in ('nueva', 'contactada', 'aceptada', 'lista_espera', 'descartada'));

-- Correo autoritativo (el de la cuenta de Google) y updated_at.
create or replace function postulaciones_completar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select u.email into new.email from auth.users u where u.id = new.user_id;
  if new.email is null then
    raise exception 'postulaciones: el usuario no tiene correo';
  end if;
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists postulaciones_completar on postulaciones;
create trigger postulaciones_completar before insert or update on postulaciones
  for each row execute function postulaciones_completar();

-- ---------------------------------------------------------------------------
-- RLS: solo la propia fila. Se puede editar mientras siga 'nueva'.
-- ---------------------------------------------------------------------------
alter table postulaciones enable row level security;

drop policy if exists postulaciones_select_propia on postulaciones;
create policy postulaciones_select_propia on postulaciones
  for select using (user_id = auth.uid());

drop policy if exists postulaciones_insert_propia on postulaciones;
create policy postulaciones_insert_propia on postulaciones
  for insert with check (user_id = auth.uid() and estado = 'nueva');

drop policy if exists postulaciones_update_propia on postulaciones;
create policy postulaciones_update_propia on postulaciones
  for update using (user_id = auth.uid() and estado = 'nueva')
  with check (user_id = auth.uid() and estado = 'nueva');

-- Privilegios minimos: el cliente solo escribe sus campos (ni estado ni email).
revoke all on postulaciones from anon, authenticated;
grant select on postulaciones to authenticated;
grant insert (user_id, nombre, url, alumnos) on postulaciones to authenticated;
grant update (nombre, url, alumnos) on postulaciones to authenticated;
grant all on postulaciones to service_role;
revoke all on function postulaciones_completar() from public, anon, authenticated;
