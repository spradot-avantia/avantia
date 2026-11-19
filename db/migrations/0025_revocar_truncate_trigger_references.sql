-- 0025_revocar_truncate_trigger_references.sql
-- Defensa en profundidad (como 0022). Los privilegios por defecto de Supabase dan a `anon` y
-- `authenticated` TRUNCATE, TRIGGER y REFERENCES sobre toda tabla nueva de `public`. TRUNCATE no
-- pasa por RLS: vacía la tabla entera, de todas las academias. PostgREST no expone TRUNCATE, así
-- que hoy no hay un camino directo para usarlo, pero la app no necesita ninguno de los tres
-- privilegios y una función con SQL dinámico (security invoker) podría abrir ese camino.
-- Idempotente. service_role y postgres conservan sus privilegios.

revoke truncate, trigger, references on all tables in schema public from anon, authenticated;

-- Tablas futuras creadas por migraciones (rol postgres).
alter default privileges for role postgres in schema public
  revoke truncate, trigger, references on tables from anon, authenticated;
