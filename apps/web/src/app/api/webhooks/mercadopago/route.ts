import { NextResponse } from "next/server";
import { acreditarPago } from "../../../../lib/pagos/acreditar";
import { verificarFirmaMercadoPago } from "../../../../lib/pagos/firma";

export const dynamic = "force-dynamic";

/**
 * Notificaciones de Mercado Pago (ADR 046). La firma x-signature se valida ANTES de
 * leer el cuerpo; después solo importa el id del pago: el estado real se consulta a
 * la API en acreditarPago (idempotente, la misma que usa la página de retorno).
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const dataId = url.searchParams.get("data.id") ?? url.searchParams.get("id");
  const valida = verificarFirmaMercadoPago({
    xSignature: req.headers.get("x-signature"),
    xRequestId: req.headers.get("x-request-id"),
    dataId,
    secreto: process.env.MERCADOPAGO_WEBHOOK_SECRET,
  });
  if (!valida) return NextResponse.json({ error: "firma inválida" }, { status: 401 });

  const tipo = url.searchParams.get("type") ?? url.searchParams.get("topic");
  let cuerpo: { type?: string; data?: { id?: string | number } } = {};
  try {
    cuerpo = await req.json();
  } catch {
    // Sin cuerpo JSON: basta con el query.
  }
  if ((cuerpo.type ?? tipo) !== "payment") return NextResponse.json({ recibido: true });

  // El id firmado es el del query; el del cuerpo debe coincidir si viene.
  if (cuerpo.data?.id != null && String(cuerpo.data.id) !== dataId) {
    return NextResponse.json({ error: "id no coincide" }, { status: 400 });
  }

  const r = await acreditarPago(String(dataId));
  if (r.estado === "invalido") {
    console.warn("[webhook mercadopago] sin acreditar", dataId, r.motivo);
    // Falla transitoria (API o base): 500 para que Mercado Pago reintente. El resto no se arregla reintentando.
    if (r.motivo === "pago no encontrado" || r.motivo === "no se pudo registrar el pago") {
      return NextResponse.json({ error: "reintentar" }, { status: 500 });
    }
  }
  return NextResponse.json({ recibido: true });
}
