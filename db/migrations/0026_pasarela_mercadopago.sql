-- 0026_pasarela_mercadopago.sql
-- ADR 046 (Propuesta): Checkout Pro de Mercado Pago, fase 1 (cuenta de prueba en dev).
-- Idempotencia de la acreditación: un pago de la pasarela (referencia_externa = id del pago en
-- Mercado Pago) se registra una sola vez por academia, aunque lleguen el retorno y el webhook.
-- Índice único completo (no parcial) para que PostgREST pueda usarlo en ON CONFLICT; los pagos
-- manuales tienen referencia_externa null y Postgres no considera iguales dos null.
-- Empieza por tenant_id (regla de aislamiento). No hay tabla nueva: no hay RLS nueva.
-- Idempotente.

create unique index if not exists pagos_tenant_referencia_uidx
  on pagos (tenant_id, referencia_externa);
