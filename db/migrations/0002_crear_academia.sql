-- 0002_crear_academia.sql
-- RQ-02: alta transaccional de academia (tenant + membresia dueno + tema base)
-- como funcion SQL invocable por RPC con la sesion del usuario. NO aplicada a
-- ninguna base remota (se pega en el SQL Editor de Supabase).
-- Idempotente: se puede ejecutar mas de una vez.
--
-- Requisitos previos: 0001_espacio_creador.sql aplicada.
--
-- ATENCION (datos existentes): el indice unico membresias_user_id_key falla si
-- algun usuario ya tiene 2+ membresias. Revisar antes con:
--   select user_id, count(*) from membresias group by 1 having count(*) > 1;

-- ---------------------------------------------------------------------------
-- membresias: rol, una academia por usuario (MVP) y RLS
-- ---------------------------------------------------------------------------
alter table membresias
  add column if not exists rol text not null default 'dueno';

alter table membresias drop constraint if exists membresias_rol_check;
alter table membresias add constraint membresias_rol_check check (rol in ('dueno'));

-- MVP: un usuario pertenece a UNA sola academia. Esto vuelve determinista a
-- auth_tenant_id() (una sola fila posible) y es la barrera dura contra dos
-- altas simultaneas del mismo usuario. Al soportar equipos/multi-academia se
-- reemplaza por (user_id, tenant_id) y un tenant "activo" explicito.
create unique index if not exists membresias_user_id_key on membresias (user_id);

-- Antes membresias no tenia RLS. Ahora: cada usuario lee SOLO sus filas.
-- Sin politicas de insert/update/delete para clientes: las membresias solo se
-- crean dentro de crear_academia() (security definer) o con service role.
alter table membresias enable row level security;

drop policy if exists membresias_select_propia on membresias;
create policy membresias_select_propia on membresias
  for select using (user_id = auth.uid());

-- Privilegios minimos. Supabase concede por defecto ALL a anon/authenticated en
-- public; se retira lo que no deben hacer directamente. La escritura de
-- tenants/membresias por el cliente de sesion pasa solo por crear_academia() y
-- por la politica de update de tenants (marca).
revoke all on membresias from anon, authenticated;
grant select on membresias to authenticated;

revoke all on tenants from anon;
revoke insert, delete on tenants from authenticated;
grant select, update on tenants to authenticated;

-- auth_tenant_id(): orden determinista aunque en el futuro se relaje el indice
-- unico (created_at, luego tenant_id).
create or replace function auth_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id
  from membresias
  where user_id = auth.uid()
  order by created_at asc, tenant_id asc
  limit 1
$$;

-- ---------------------------------------------------------------------------
-- Validacion de subdominio (duplica lib/tenant/reservados.ts)
-- ---------------------------------------------------------------------------
-- IMPORTANTE: la lista de reservados y la regex DEBEN mantenerse en sincronia
-- con apps/web/src/lib/tenant/reservados.ts (SUBDOMINIOS_RESERVADOS y FORMATO).
-- Si cambias una, cambia la otra (y crea una migracion nueva con esta funcion).
create or replace function subdominio_error(p_subdomain text)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  s text := lower(btrim(coalesce(p_subdomain, '')));
begin
  if s !~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$' then
    return 'subdominio_invalido';
  end if;
  if s = any (array[
    'app', 'www', 'api', 'admin', 'staging', 'dev', 'mail', 'smtp', 'ftp',
    'docs', 'blog', 'status', 'soporte', 'support', 'ayuda', 'help',
    'login', 'registro', 'auth', 'cdn', 'assets', 'static', 'avantia'
  ]) then
    return 'subdominio_reservado';
  end if;
  return null;
end
$$;

-- ---------------------------------------------------------------------------
-- crear_academia: alta atomica (RQ-02)
-- ---------------------------------------------------------------------------
-- Errores (el mensaje es un codigo estable que el backend mapea a espanol):
--   no_autenticado, nombre_invalido, subdominio_invalido, subdominio_reservado,
--   ya_tiene_academia, subdominio_tomado.
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
  v_err text;
  v_tenant tenants;
  v_constraint text;
begin
  if v_uid is null then
    raise exception 'no_autenticado' using errcode = '28000';
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
    -- slug = subdominio. Tema base: color por defecto (azul de marca) y logo
    -- con nombre; el resto se completa en el onboarding.
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

-- ---------------------------------------------------------------------------
-- subdominio_disponible: comprobacion en vivo (solo booleano)
-- ---------------------------------------------------------------------------
-- Diseno anti-enumeracion: exige sesion, devuelve SOLO true/false (invalido,
-- reservado y tomado son indistinguibles) y no expone ninguna columna del
-- tenant. Pendiente (Etapa 2): limite de tasa para frenar barridos con una
-- cuenta real; el alta final igual la decide crear_academia().
create or replace function subdominio_disponible(p_subdomain text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  s text := lower(btrim(coalesce(p_subdomain, '')));
begin
  if auth.uid() is null then
    raise exception 'no_autenticado' using errcode = '28000';
  end if;
  if subdominio_error(s) is not null then
    return false;
  end if;
  return not exists (
    select 1 from tenants where subdomain = s or slug = s or custom_domain = s
  );
end
$$;

revoke execute on function subdominio_disponible(text) from public, anon;
grant execute on function subdominio_disponible(text) to authenticated;

revoke execute on function subdominio_error(text) from public, anon;
grant execute on function subdominio_error(text) to authenticated;
