-- 0014_identidad_academia.sql
-- Identidad visual por academia más allá del color (ADR 027): tipografía y forma.
-- Son configuración del tenant: no hay tablas nuevas; la RLS (tenants_update_propio)
-- y los índices por tenant_id existentes cubren el cambio. Valores de lista cerrada.
-- Los defaults ('clasico' + 'suave') reproducen la apariencia actual: no cambia
-- ninguna academia existente. Idempotente.

alter table tenants
  add column if not exists tipografia text not null default 'clasico',
  add column if not exists forma text not null default 'suave';

alter table tenants drop constraint if exists tenants_tipografia_check;
alter table tenants add constraint tenants_tipografia_check
  check (tipografia in ('clasico', 'moderno', 'cercano', 'editorial'));

alter table tenants drop constraint if exists tenants_forma_check;
alter table tenants add constraint tenants_forma_check
  check (forma in ('recta', 'suave'));
