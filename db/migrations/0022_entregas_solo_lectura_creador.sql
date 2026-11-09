-- 0022_entregas_solo_lectura_creador.sql
-- Las entregas (ADR 038) las escribe solo el servidor con service_role. Los privilegios por
-- defecto de Supabase dan a `authenticated` insert/update/delete sobre toda tabla nueva; RLS ya
-- los bloquea (no hay políticas de escritura), pero se quitan también a nivel de permisos
-- (defensa en profundidad). Idempotente.
revoke insert, update, delete on entregas from authenticated;
