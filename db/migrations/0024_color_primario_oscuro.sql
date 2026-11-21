-- 0024_color_primario_oscuro.sql
-- Color de la academia para el modo oscuro (ADR 045). Idempotente.
-- null = automático: la app aclara color_primario (mismo tono) hasta llegar a 4,5:1 sobre los
-- fondos oscuros (lib/creador/color.ts, colorParaOscuro). Si el creador elige otro, se guarda aquí.
-- Es una columna de tenants: la tabla ya tiene RLS por tenant y grant select/update a authenticated.
-- Orden de despliegue: aplicar esta migración ANTES de desplegar el código que la lee
-- (lib/tenant/resolve.ts y lib/creador/tenantActual.ts seleccionan la columna).

alter table tenants add column if not exists color_primario_oscuro text;

alter table tenants drop constraint if exists tenants_color_primario_oscuro_check;
alter table tenants add constraint tenants_color_primario_oscuro_check
  check (color_primario_oscuro is null or color_primario_oscuro ~* '^#[0-9a-f]{6}$');

comment on column tenants.color_primario_oscuro is
  'Color de marca para modo oscuro (#rrggbb). null = automático a partir de color_primario (ADR 045).';
