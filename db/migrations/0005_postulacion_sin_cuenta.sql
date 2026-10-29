-- 0005_postulacion_sin_cuenta.sql
-- Postulacion sin iniciar sesion (ADR 014). NO aplicada a ninguna base remota
-- (se pega en el SQL Editor de Supabase). Idempotente.
--
-- Ahora el postulante deja nombre, correo y un texto sobre lo que hace hoy, sin
-- cuenta: la fila la escribe el servidor con service role (no hay user_id). Los
-- grants a anon/authenticated no cambian: nadie escribe esta tabla desde el
-- cliente salvo la via antigua con sesion, que queda sin uso.

alter table postulaciones alter column user_id drop not null;
alter table postulaciones add column if not exists descripcion text;
alter table postulaciones add column if not exists invitado_en timestamptz;

alter table postulaciones drop constraint if exists postulaciones_descripcion_check;
alter table postulaciones add constraint postulaciones_descripcion_check
  check (descripcion is null or char_length(descripcion) <= 600);

-- Una postulacion por correo (sin distinguir mayusculas).
create unique index if not exists postulaciones_email_key on postulaciones (lower(email));

-- Con user_id el correo sale de auth.users (via antigua); sin user_id viene del
-- servidor. Siempre en minusculas y sin espacios.
create or replace function postulaciones_completar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_id is not null then
    select u.email into new.email from auth.users u where u.id = new.user_id;
  end if;
  new.email = lower(btrim(new.email));
  if new.email is null or new.email = '' then
    raise exception 'postulaciones: falta el correo';
  end if;
  new.updated_at = now();
  return new;
end;
$$;
