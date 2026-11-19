// Reglas para acreditar un pago de Mercado Pago (ADR 046). Módulo puro: no confía
// en lo que diga el navegador ni el webhook, solo en el pago consultado a la API.

/** Campos del pago (Payment.get) que importan para acreditar. */
export interface PagoMercadoPago {
  id: string;
  status?: string;
  transaction_amount?: number;
  currency_id?: string;
  external_reference?: string;
  metadata?: Record<string, unknown> | null;
}

export type EvaluacionPago =
  | { ok: true }
  | { ok: false; motivo: "pendiente" | "rechazado" | "referencia" | "tenant" | "monto" | "moneda" };

export const MONEDA_PASARELA = "CLP";

const PENDIENTES = new Set(["pending", "in_process", "authorized", "in_mediation"]);

/** Pesos (CLP sin decimales) → centavos de la columna precio_centavos. */
export const centavosDePesos = (pesos: number) => Math.round(pesos * 100);
/** Centavos → monto que se envía a Mercado Pago (CLP no admite decimales). */
export const pesosDeCentavos = (centavos: number) => Math.round(centavos / 100);

export function evaluarPago(
  pago: PagoMercadoPago,
  esperado: { inscripcionId: string; tenantId: string; montoCentavos: number },
): EvaluacionPago {
  if (pago.external_reference !== esperado.inscripcionId) return { ok: false, motivo: "referencia" };
  const tenantMeta = pago.metadata?.tenant_id;
  if (tenantMeta !== esperado.tenantId) return { ok: false, motivo: "tenant" };
  if (pago.status !== "approved") return { ok: false, motivo: PENDIENTES.has(pago.status ?? "") ? "pendiente" : "rechazado" };
  if ((pago.currency_id ?? "").toUpperCase() !== MONEDA_PASARELA) return { ok: false, motivo: "moneda" };
  if (esperado.montoCentavos <= 0 || centavosDePesos(pago.transaction_amount ?? -1) !== esperado.montoCentavos) {
    return { ok: false, motivo: "monto" };
  }
  return { ok: true };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const esUuid = (s: unknown): s is string => typeof s === "string" && UUID.test(s);
/** Los ids de pago de Mercado Pago son numéricos. */
export const esIdPago = (s: unknown): s is string => typeof s === "string" && /^\d{1,20}$/.test(s);
