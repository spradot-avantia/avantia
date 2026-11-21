// Interruptor de la pasarela (ADR 046), sin dependencias: lo usan páginas, el webhook y sus pruebas.
// Activa solo si hay credenciales y no se apagó a propósito. Sin ella, el creador cobra
// por fuera y activa la inscripción a mano (producción hoy).
export function pagosHabilitados(): boolean {
  return process.env.PAGOS_HABILITADOS !== "false" && !!process.env.MERCADOPAGO_ACCESS_TOKEN;
}
