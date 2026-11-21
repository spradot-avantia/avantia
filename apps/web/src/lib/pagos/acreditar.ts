// Acreditación de pagos de Mercado Pago (ADR 046). Solo backend.
// La llaman la página de retorno y el webhook; ambas pueden llegar varias veces
// para el mismo pago: es idempotente (índice único pagos(tenant_id, referencia_externa)
// y la inscripción solo pasa de "pendiente" a "activa").
// Usa service role porque el webhook no tiene sesión; cada query filtra por tenant_id,
// que sale del pago consultado a Mercado Pago (metadata) y se contrasta con la inscripción.
import { Payment } from "mercadopago";
import { registrarEvento } from "../alumno/eventos";
import { getMercadopagoClient } from "../mercadopago";
import { supabaseAdmin } from "../supabase/admin";
import { esIdPago, esUuid, evaluarPago, type PagoMercadoPago } from "./reglas";

export type ResultadoAcreditar =
  | { estado: "aprobado"; tenantId: string; inscripcionId: string; cursoId: string; alumnoId: string; nuevo: boolean }
  | { estado: "pendiente" | "rechazado"; tenantId: string; inscripcionId: string; cursoId: string; alumnoId: string; detalle?: string }
  | { estado: "invalido"; motivo: string };

export async function obtenerPagoMercadoPago(paymentId: string): Promise<PagoMercadoPago> {
  const p = await new Payment(getMercadopagoClient()).get({ id: paymentId });
  return {
    id: String(p.id),
    status: p.status,
    status_detail: p.status_detail,
    transaction_amount: p.transaction_amount,
    currency_id: p.currency_id,
    external_reference: p.external_reference,
    metadata: p.metadata ?? null,
  };
}

export async function acreditarPago(
  paymentId: string,
  deps: { obtenerPago?: (id: string) => Promise<PagoMercadoPago> } = {},
): Promise<ResultadoAcreditar> {
  if (!esIdPago(paymentId)) return { estado: "invalido", motivo: "id de pago inválido" };

  let pago: PagoMercadoPago;
  try {
    pago = await (deps.obtenerPago ?? obtenerPagoMercadoPago)(paymentId);
  } catch (e) {
    console.error("[pagos] no se pudo consultar el pago", paymentId, e instanceof Error ? e.message : e);
    return { estado: "invalido", motivo: "pago no encontrado" };
  }

  const inscripcionId = pago.external_reference;
  const tenantId = pago.metadata?.tenant_id;
  if (!esUuid(inscripcionId) || !esUuid(tenantId)) return { estado: "invalido", motivo: "pago sin referencia de Avantia" };

  const { data: insc } = await supabaseAdmin
    .from("inscripciones")
    .select("id, tenant_id, curso_id, alumno_id, estado")
    .eq("tenant_id", tenantId)
    .eq("id", inscripcionId)
    .maybeSingle();
  if (!insc) return { estado: "invalido", motivo: "inscripción no encontrada" };

  const { data: curso } = await supabaseAdmin
    .from("cursos")
    .select("precio_centavos")
    .eq("tenant_id", tenantId)
    .eq("id", insc.curso_id)
    .maybeSingle();
  if (!curso) return { estado: "invalido", motivo: "curso no encontrado" };

  const base = { tenantId, inscripcionId, cursoId: insc.curso_id as string, alumnoId: insc.alumno_id as string };
  const ev = evaluarPago(pago, { inscripcionId, tenantId, montoCentavos: curso.precio_centavos as number });
  if (!ev.ok) {
    if (ev.motivo === "pendiente") return { estado: "pendiente", ...base };
    if (ev.motivo === "rechazado") return { estado: "rechazado", ...base, detalle: pago.status_detail };
    console.error("[pagos] pago aprobado que no calza con la inscripción", paymentId, ev.motivo);
    return { estado: "invalido", motivo: ev.motivo };
  }

  // 1) El pago: una sola fila por referencia aunque llegue dos veces.
  const ins = await supabaseAdmin
    .from("pagos")
    .upsert(
      {
        tenant_id: tenantId,
        inscripcion_id: inscripcionId,
        monto_centavos: curso.precio_centavos,
        medio: "pasarela",
        registrado_por: "pasarela",
        referencia_externa: pago.id,
      },
      { onConflict: "tenant_id,referencia_externa", ignoreDuplicates: true },
    )
    .select("id");
  if (ins.error) {
    console.error("[pagos] no se pudo registrar el pago", paymentId, ins.error.message);
    return { estado: "invalido", motivo: "no se pudo registrar el pago" };
  }
  const nuevo = (ins.data ?? []).length > 0;

  // 2) La inscripción: solo pendiente → activa (una rechazada o cancelada no se reabre sola).
  const act = await supabaseAdmin
    .from("inscripciones")
    .update({ estado: "activa", activada_por: "pago", activada_en: new Date().toISOString() })
    .eq("tenant_id", tenantId)
    .eq("id", inscripcionId)
    .eq("estado", "pendiente")
    .select("id");
  const activada = (act.data ?? []).length > 0;

  if (nuevo) await registrarEvento(tenantId, { tipo: "pago_registrado", alumnoId: base.alumnoId, cursoId: base.cursoId, entidadTipo: "curso", entidadId: base.cursoId });
  if (activada) await registrarEvento(tenantId, { tipo: "inscripcion_activada", alumnoId: base.alumnoId, cursoId: base.cursoId, entidadTipo: "curso", entidadId: base.cursoId });

  return { estado: "aprobado", ...base, nuevo };
}
