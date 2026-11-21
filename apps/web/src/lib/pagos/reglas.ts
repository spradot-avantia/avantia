// Reglas para acreditar un pago de Mercado Pago (ADR 046). Módulo puro: no confía
// en lo que diga el navegador ni el webhook, solo en el pago consultado a la API.

/** Campos del pago (Payment.get) que importan para acreditar. */
export interface PagoMercadoPago {
  id: string;
  status?: string;
  /** Motivo fino del estado (p. ej. "cc_rejected_insufficient_amount"). */
  status_detail?: string;
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

const RECHAZOS: Record<string, string> = {
  cc_rejected_insufficient_amount: "La tarjeta no tiene saldo o cupo suficiente.",
  cc_rejected_bad_filled_security_code: "El código de seguridad (CVV) no es correcto.",
  cc_rejected_bad_filled_date: "La fecha de vencimiento no es correcta.",
  cc_rejected_bad_filled_card_number: "El número de la tarjeta no es correcto.",
  cc_rejected_bad_filled_other: "Algún dato de la tarjeta no es correcto.",
  cc_rejected_call_for_authorize: "Tu banco pide que autorices este pago. Llámalo y vuelve a intentarlo.",
  cc_rejected_card_disabled: "La tarjeta no está activa. Actívala con tu banco o usa otra.",
  cc_rejected_duplicated_payment: "Ya hiciste un pago por este mismo monto. Revisa «Mis cursos» antes de volver a pagar.",
  cc_rejected_max_attempts: "Llegaste al máximo de intentos con esta tarjeta. Usa otra o espera un rato.",
  cc_rejected_high_risk: "Mercado Pago no pudo aprobar el pago. Prueba con otro medio de pago.",
  cc_rejected_blacklist: "Mercado Pago no pudo aprobar el pago. Prueba con otro medio de pago.",
  cc_rejected_card_error: "La tarjeta no pudo procesar el pago. Prueba con otra.",
  rejected_by_bank: "Tu banco rechazó el pago. Prueba con otra tarjeta o medio de pago.",
};

/** Motivo de rechazo de Mercado Pago (status_detail) → mensaje claro para el alumno. */
export function mensajeRechazo(statusDetail: string | null | undefined): string {
  return RECHAZOS[statusDetail ?? ""] ?? "Tu medio de pago rechazó el cobro. Puedes intentarlo con otra tarjeta o medio de pago.";
}

/** Categoría de Mercado Pago para cursos (items.category_id; mejora la aprobación antifraude). */
export const CATEGORIA_CURSO = "learnings";

/** Nombre del alumno → payer.name / payer.surname: primera palabra y el resto. */
export function nombreComprador(nombre: string): { name?: string; surname?: string } {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return {};
  const [name, ...resto] = partes;
  return resto.length ? { name, surname: resto.join(" ") } : { name };
}

/** Descripción del ítem: texto plano en una línea, máx. 256 caracteres; cae al título. */
export function descripcionItem(descripcion: string | null | undefined, titulo: string): string {
  const t = (descripcion ?? "").replace(/\s+/g, " ").trim() || titulo.trim();
  return t.length > 256 ? `${t.slice(0, 255)}…` : t;
}

/**
 * Clave de idempotencia de la preferencia: estable por inscripción y precio, para que
 * un doble clic o un reintento no creen dos preferencias. Cambia si cambia el precio.
 */
export const claveIdempotenciaPreferencia = (inscripcionId: string, precioCentavos: number) =>
  `pref-${inscripcionId}-${precioCentavos}`;

const UUID =/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const esUuid = (s: unknown): s is string => typeof s === "string" && UUID.test(s);
/** Los ids de pago de Mercado Pago son numéricos. */
export const esIdPago = (s: unknown): s is string => typeof s === "string" && /^\d{1,20}$/.test(s);
