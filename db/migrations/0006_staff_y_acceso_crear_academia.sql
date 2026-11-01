-- 0006_staff_y_acceso_crear_academia.sql
-- ADR 016: rol staff real (tabla `staff`) y crear_academia() restringida a
-- correos con acceso (staff o postulacion aceptada). NO aplicada a ninguna base
-- remota (se pega en el SQL Editor de Supabase). Idempotente.
--
-- Requisitos previos: 0002 y 0005 aplicadas.
-- Tabla de plataforma SIN tenant_id (excepcion como `postulaciones`, ADR 011):
-- solo la lee/escribe el backend con service role. Los primeros admins se
-- siembran desde STAFF_EMAILS la primera vez que ingresan; despues se gestionan
-- en /admin/equipo.

create table if not exists staff (
  email text primary key,
  rol text not null default 'admin',
  created_at timestamptz not null default now(),
  created_by text
);

alter table staff drop constraint if exists staff_email_check;
alter table staff add constraint staff_email_check check (email = lower(btrim(email)) and email <> '');
alter table staff drop constraint if exists staff_rol_check;
alter table staff add constraint staff_rol_check check (rol in ('admin'));

-- RLS sin politicas: ningun cliente (anon/authenticated) la toca.
alter table staff enable row level security;
revoke all on staff from anon, authenticated;
grant all on staff to service_role;

-- ¿Este correo puede usar la plataforma? Staff o postulacion aceptada.
create or replace function tiene_acceso_plataforma(p_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from staff where email = lower(btrim(p_email)))
      or exists (select 1 from postulaciones where lower(email) = lower(btrim(p_email)) and estado = 'aceptada')
$$;

-- Solo la usan funciones security definer (crear_academia) y el service role.
revoke execute on function tiene_acceso_plataforma(text) from public, anon, authenticated;

-- crear_academia: igual que 0002 + exige acceso (error estable `sin_invitacion`).
create or replace function crear_academia(
  p_nombre text,
  p_subdomain text,
  p_frase text default null,
  p_area text default null
)
returns tenants
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_nombre text := btrim(coalesce(p_nombre, ''));
  v_sub text := lower(btrim(coalesce(p_subdomain, '')));
  v_frase text := nullif(btrim(coalesce(p_frase, '')), '');
  v_area text := nullif(btrim(coalesce(p_area, '')), '');
  v_email text;
  v_err text;
  v_tenant tenants;
  v_constraint text;
begin
  if v_uid is null then
    raise exception 'no_autenticado' using errcode = '28000';
  end if;

  select u.email into v_email from auth.users u where u.id = v_uid;
  if not tiene_acceso_plataforma(v_email) then
    raise exception 'sin_invitacion' using errcode = '42501';
  end if;

  if char_length(v_nombre) not between 2 and 60
     or char_length(coalesce(v_frase, '')) > 100
     or char_length(coalesce(v_area, '')) > 60 then
    raise exception 'nombre_invalido' using errcode = '22023';
  end if;

  v_err := subdominio_error(v_sub);
  if v_err is not null then
    raise exception '%', v_err using errcode = '22023';
  end if;

  -- Serializa altas concurrentes del MISMO usuario (doble clic, dos pestanas).
  perform pg_advisory_xact_lock(hashtextextended('crear_academia:' || v_uid::text, 0));

  if exists (select 1 from membresias where user_id = v_uid) then
    raise exception 'ya_tiene_academia' using errcode = 'P0001';
  end if;

  begin
    insert into tenants (slug, subdomain, nombre, frase, area, color_primario, logo_modo)
    values (v_sub, v_sub, v_nombre, v_frase, v_area, '#2563eb', 'logo_y_nombre')
    returning * into v_tenant;

    insert into membresias (user_id, tenant_id, rol)
    values (v_uid, v_tenant.id, 'dueno');
  exception
    when unique_violation then
      get stacked diagnostics v_constraint = constraint_name;
      if v_constraint like 'membresias%' then
        raise exception 'ya_tiene_academia' using errcode = 'P0001';
      end if;
      raise exception 'subdominio_tomado' using errcode = '23505';
  end;

  return v_tenant;
end
$$;

revoke execute on function crear_academia(text, text, text, text) from public, anon;
grant execute on function crear_academia(text, text, text, text) to authenticated;
