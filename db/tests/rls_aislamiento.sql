-- db/tests/rls_aislamiento.sql
-- Pruebas de aislamiento multi-tenant (RQ-04) y de atomicidad de crear_academia
-- (RQ-02). Simula DOS usuarios/tenants (A y B) y verifica que A no ve ni escribe
-- datos de B en tenants, membresias, cursos, modulos, lecciones e invitaciones.
--
-- COMO EJECUTAR
--   Requisito: migraciones 0001 y 0002 aplicadas.
--   Opcion 1 (recomendada): Supabase Dashboard > SQL Editor > pegar TODO el
--     archivo > Run. Corre como `postgres`; cada bloque cambia a `authenticated`
--     con `set local role` + claims JWT simulados. TODO queda dentro de una
--     transaccion que termina en ROLLBACK: no deja datos.
--   Opcion 2: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/tests/rls_aislamiento.sql
--   Resultado: si todo pasa se ve "NOTICE: OK ..." por prueba y al final
--   "TODAS LAS PRUEBAS PASARON". Si algo falla, la ejecucion aborta con
--   "FALLO: <descripcion>".
--   Usalo contra un proyecto de DESARROLLO/staging, no contra produccion.
--
-- Usuarios ficticios en auth.users (se revierten con el rollback).

begin;

insert into auth.users (id, instance_id, aud, role, email)
values
  ('aaaaaaaa-0000-4000-8000-00000000000a', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a-rls@test.local'),
  ('bbbbbbbb-0000-4000-8000-00000000000b', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b-rls@test.local'),
  ('cccccccc-0000-4000-8000-00000000000c', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'c-rls@test.local');

-- ---------------------------------------------------------------------------
-- Ayudas (viven en pg_temp: desaparecen con la sesion)
-- ---------------------------------------------------------------------------
create function pg_temp.como(p_uid uuid) returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims',
    case when p_uid is null then '{}' else json_build_object('sub', p_uid, 'role', 'authenticated')::text end, true);
  execute 'set local role authenticated';
end $$;

create function pg_temp.como_admin() returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);
end $$;

create function pg_temp.contar(p_sql text) returns bigint language plpgsql as $$
declare n bigint;
begin execute p_sql into n; return n; end $$;

create function pg_temp.filas(p_sql text) returns bigint language plpgsql as $$
declare n bigint;
begin execute p_sql; get diagnostics n = row_count; return n; end $$;

-- Exige que p_sql falle con un mensaje que contenga p_patron.
create function pg_temp.espera_error(p_desc text, p_sql text, p_patron text) returns void language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    if sqlerrm ilike '%' || p_patron || '%' then
      raise notice 'OK % (error esperado: %)', p_desc, sqlerrm;
      return;
    end if;
    raise exception 'FALLO: % -> error inesperado: %', p_desc, sqlerrm;
  end;
  raise exception 'FALLO: % -> debio fallar con "%" y no fallo', p_desc, p_patron;
end $$;

create function pg_temp.igual(p_desc text, p_real bigint, p_esperado bigint) returns void language plpgsql as $$
begin
  if p_real is distinct from p_esperado then
    raise exception 'FALLO: % -> esperado %, obtenido %', p_desc, p_esperado, p_real;
  end if;
  raise notice 'OK % (=%)', p_desc, p_real;
end $$;

-- ---------------------------------------------------------------------------
-- 1) crear_academia: caminos felices y de error
-- ---------------------------------------------------------------------------
do $$
declare ta tenants; tb tenants;
begin
  perform pg_temp.como(null);
  perform pg_temp.espera_error('sin sesion no puede crear', $q$select crear_academia('X Academia','x-sin-sesion','','')$q$, 'no_autenticado');

  perform pg_temp.como('aaaaaaaa-0000-4000-8000-00000000000a');
  select * into ta from crear_academia('Academia A', 'rls-test-aaa', 'frase A', 'area A');
  perform pg_temp.igual('A crea su academia (tenant_id generado por la base)', (ta.id is not null)::int, 1);
  perform pg_temp.igual('tema base: color por defecto', (ta.color_primario = '#2563eb')::int, 1);

  perform pg_temp.como('bbbbbbbb-0000-4000-8000-00000000000b');
  select * into tb from crear_academia('Academia B', 'rls-test-bbb', null, null);

  -- Subdominio tomado (B intenta el de A) y reservado/invalido
  perform pg_temp.como('cccccccc-0000-4000-8000-00000000000c');
  perform pg_temp.espera_error('subdominio tomado', $q$select crear_academia('Otra','rls-test-aaa','','')$q$, 'subdominio_tomado');
  perform pg_temp.espera_error('subdominio reservado', $q$select crear_academia('Otra','admin','','')$q$, 'subdominio_reservado');
  perform pg_temp.espera_error('subdominio invalido', $q$select crear_academia('Otra','-mal-','','')$q$, 'subdominio_invalido');
  perform pg_temp.espera_error('nombre invalido', $q$select crear_academia('x','rls-test-ccc','','')$q$, 'nombre_invalido');
  perform pg_temp.igual('C sigue sin academia tras errores', pg_temp.contar('select count(*) from membresias'), 0);

  -- Un dueno no puede crear otra (MVP: una academia por usuario)
  perform pg_temp.como('aaaaaaaa-0000-4000-8000-00000000000a');
  perform pg_temp.espera_error('A no puede crear una segunda', $q$select crear_academia('Segunda A','rls-test-aaa2','','')$q$, 'ya_tiene_academia');
  perform pg_temp.igual('subdominio_disponible: tomado -> false', (select subdominio_disponible('rls-test-bbb'))::int, 0);
  perform pg_temp.igual('subdominio_disponible: libre -> true', (select subdominio_disponible('rls-test-libre'))::int, 1);

  perform pg_temp.como_admin();
end $$;

-- ---------------------------------------------------------------------------
-- 2) Datos de negocio de A y B (se insertan como postgres, que salta RLS)
-- ---------------------------------------------------------------------------
do $$
declare ia uuid; ib uuid; ca uuid; cb uuid; ma uuid; mb uuid;
begin
  select id into ia from tenants where subdomain = 'rls-test-aaa';
  select id into ib from tenants where subdomain = 'rls-test-bbb';

  insert into cursos (tenant_id, slug, titulo) values (ia, 'curso-a', 'Curso A') returning id into ca;
  insert into cursos (tenant_id, slug, titulo) values (ib, 'curso-b', 'Curso B') returning id into cb;
  insert into modulos (tenant_id, curso_id, titulo) values (ia, ca, 'Mod A') returning id into ma;
  insert into modulos (tenant_id, curso_id, titulo) values (ib, cb, 'Mod B') returning id into mb;
  insert into lecciones (tenant_id, curso_id, modulo_id, titulo) values (ia, ca, ma, 'Lec A');
  insert into lecciones (tenant_id, curso_id, modulo_id, titulo) values (ib, cb, mb, 'Lec B');
  insert into invitaciones (tenant_id, curso_id, email) values (ia, ca, 'alumno-a@test.local');
  insert into invitaciones (tenant_id, curso_id, email) values (ib, cb, 'alumno-b@test.local');
end $$;

-- ---------------------------------------------------------------------------
-- 3) Aislamiento: A no ve ni escribe nada de B (y simetrico con B sobre A)
-- ---------------------------------------------------------------------------
do $$
declare ia uuid; ib uuid; t text;
begin
  select id into ia from tenants where subdomain = 'rls-test-aaa';
  select id into ib from tenants where subdomain = 'rls-test-bbb';

  perform pg_temp.como('aaaaaaaa-0000-4000-8000-00000000000a');

  perform pg_temp.igual('A: auth_tenant_id() = su tenant', (auth_tenant_id() = ia)::int, 1);
  perform pg_temp.igual('A ve solo 1 tenant', pg_temp.contar('select count(*) from tenants'), 1);
  perform pg_temp.igual('A no ve el tenant de B', pg_temp.contar(format('select count(*) from tenants where id = %L', ib)), 0);
  perform pg_temp.igual('A ve solo su membresia', pg_temp.contar('select count(*) from membresias'), 1);
  perform pg_temp.igual('A no ve membresias de B', pg_temp.contar(format('select count(*) from membresias where tenant_id = %L', ib)), 0);

  foreach t in array array['cursos', 'modulos', 'lecciones', 'invitaciones'] loop
    perform pg_temp.igual(format('A ve sus filas de %s', t), pg_temp.contar(format('select count(*) from %I where tenant_id = %L', t, ia)), 1);
    perform pg_temp.igual(format('A NO ve filas de B en %s', t), pg_temp.contar(format('select count(*) from %I where tenant_id = %L', t, ib)), 0);
    perform pg_temp.igual(format('A NO actualiza filas de B en %s', t), pg_temp.filas(format('update %I set tenant_id = tenant_id where tenant_id = %L', t, ib)), 0);
    perform pg_temp.igual(format('A NO borra filas de B en %s', t), pg_temp.filas(format('delete from %I where tenant_id = %L', t, ib)), 0);
  end loop;

  -- Escrituras con tenant_id ajeno: RLS (with check) debe rechazarlas
  perform pg_temp.espera_error('A no inserta curso en tenant de B',
    format($q$insert into cursos (tenant_id, slug, titulo) values (%L, 'intruso', 'Intruso')$q$, ib), 'row-level security');
  perform pg_temp.espera_error('A no inserta invitacion en tenant de B',
    format($q$insert into invitaciones (tenant_id, curso_id, email) values (%L, (select id from cursos limit 1), 'x@test.local')$q$, ib), 'violates');

  -- Mover una fila propia al tenant de B tambien debe fallar
  perform pg_temp.espera_error('A no traspasa un curso suyo a B',
    format($q$update cursos set tenant_id = %L where tenant_id = %L$q$, ib, ia), 'row-level security');

  -- tenants: sin insert/delete para clientes, y update solo del propio
  perform pg_temp.espera_error('cliente no inserta tenants directo',
    $q$insert into tenants (slug, subdomain, nombre) values ('hack','hack','Hack')$q$, 'permission denied');
  perform pg_temp.espera_error('cliente no borra tenants',
    format($q$delete from tenants where id = %L$q$, ia), 'permission denied');
  perform pg_temp.igual('A NO actualiza el tenant de B', pg_temp.filas(format($q$update tenants set nombre = 'pwn' where id = %L$q$, ib)), 0);
  perform pg_temp.igual('A SI actualiza su tenant', pg_temp.filas(format($q$update tenants set nombre = 'Academia A2' where id = %L$q$, ia)), 1);

  -- membresias: sin escritura directa (no se puede auto-agregar a B)
  perform pg_temp.espera_error('A no se auto-agrega a la academia de B',
    format($q$insert into membresias (user_id, tenant_id) values ('aaaaaaaa-0000-4000-8000-00000000000a', %L)$q$, ib), 'permission denied');

  -- Simetria: B tampoco ve datos de A
  perform pg_temp.como('bbbbbbbb-0000-4000-8000-00000000000b');
  foreach t in array array['cursos', 'modulos', 'lecciones', 'invitaciones'] loop
    perform pg_temp.igual(format('B NO ve filas de A en %s', t), pg_temp.contar(format('select count(*) from %I where tenant_id = %L', t, ia)), 0);
  end loop;
  perform pg_temp.igual('B no ve el tenant de A', pg_temp.contar(format('select count(*) from tenants where id = %L', ia)), 0);

  -- Anonimo: nada
  perform pg_temp.como_admin();
  execute 'set local role anon';
  perform pg_temp.espera_error('anon no lee tenants', 'select * from tenants', 'permission denied');
  perform pg_temp.como_admin();
end $$;

-- ---------------------------------------------------------------------------
-- 4) Atomicidad de crear_academia: si falla la membresia, no queda el tenant
-- ---------------------------------------------------------------------------
-- Se inyecta una falla con un trigger en membresias (se revierte con el rollback).
create function public.zz_test_falla_membresia() returns trigger language plpgsql as $$
begin raise exception 'falla_inyectada'; end $$;

do $$
declare antes bigint; despues bigint;
begin
  perform pg_temp.como_admin();
  create trigger zz_falla_inyectada before insert on membresias
    for each row execute function public.zz_test_falla_membresia();

  select count(*) into antes from tenants;

  perform pg_temp.como('cccccccc-0000-4000-8000-00000000000c');
  perform pg_temp.espera_error('falla al crear la membresia',
    $q$select crear_academia('Academia C','rls-test-ccc','','')$q$, 'falla_inyectada');

  perform pg_temp.como_admin();
  select count(*) into despues from tenants;
  perform pg_temp.igual('atomicidad: no quedo tenant huerfano', despues, antes);
  perform pg_temp.igual('atomicidad: el subdominio sigue libre',
    pg_temp.contar($q$select count(*) from tenants where subdomain = 'rls-test-ccc'$q$), 0);

  drop trigger zz_falla_inyectada on membresias;
end $$;

-- ---------------------------------------------------------------------------
-- 5) Concurrencia (manual): ver instrucciones al pie. Aqui se verifica la barrera
--    dura: la unicidad de membresias(user_id) y tenants(subdomain).
-- ---------------------------------------------------------------------------
do $$
begin
  perform pg_temp.como_admin();
  perform pg_temp.espera_error('indice unico: un usuario, una membresia',
    $q$insert into membresias (user_id, tenant_id) select user_id, tenant_id from membresias limit 1$q$, 'duplicate key');
  perform pg_temp.espera_error('subdomain unico',
    $q$insert into tenants (slug, subdomain, nombre) values ('otro-slug', 'rls-test-aaa', 'dup')$q$, 'duplicate key');
  raise notice 'TODAS LAS PRUEBAS PASARON';
end $$;

rollback;

-- PRUEBA MANUAL DE CONCURRENCIA (RQ-02, "dos altas simultaneas del mismo nombre"):
--   Abre dos pestanas del SQL Editor / dos sesiones psql con usuarios distintos y
--   en ambas ejecuta a la vez, dentro de `begin;` (sin commit aun):
--     select set_config('request.jwt.claims', '{"sub":"<uuid usuario>","role":"authenticated"}', true);
--     set local role authenticated;
--     select crear_academia('Mismo Nombre', 'mismo-nombre');
--   La segunda se queda esperando al commit/rollback de la primera y luego falla
--   con "subdominio_tomado" (indice unico), sin crear un segundo tenant.
