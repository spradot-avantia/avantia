// Firma de las notificaciones (webhooks) de Mercado Pago. Módulo puro, solo backend.
// Cabecera x-signature: "ts=<marca>,v1=<hmac hex>". Se firma el manifiesto
// "id:<data.id>;request-id:<x-request-id>;ts:<ts>;" con HMAC-SHA256 y la clave
// secreta del webhook (MERCADOPAGO_WEBHOOK_SECRET). Se valida ANTES de leer el payload.
import { createHmac, timingSafeEqual } from "node:crypto";

export function parsearXSignature(cabecera: string | null | undefined): { ts: string; v1: string } | null {
  if (!cabecera) return null;
  let ts = "";
  let v1 = "";
  for (const parte of cabecera.split(",")) {
    const [k, ...resto] = parte.split("=");
    const v = resto.join("=").trim();
    if (k?.trim() === "ts") ts = v;
    if (k?.trim() === "v1") v1 = v;
  }
  return ts && v1 ? { ts, v1 } : null;
}

/** data.id alfanumérico va en minúsculas en el manifiesto (documentación de Mercado Pago). */
export function manifiestoFirma(dataId: string, requestId: string | null | undefined, ts: string): string {
  const id = /^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId;
  return `id:${id};${requestId ? `request-id:${requestId};` : ""}ts:${ts};`;
}

export function verificarFirmaMercadoPago(p: {
  xSignature: string | null | undefined;
  xRequestId: string | null | undefined;
  dataId: string | null | undefined;
  secreto: string | undefined;
  ahoraMs?: number;
  toleranciaMs?: number;
}): boolean {
  if (!p.secreto || !p.dataId) return false;
  const firma = parsearXSignature(p.xSignature);
  if (!firma || !/^\d+$/.test(firma.ts) || !/^[0-9a-f]{64}$/i.test(firma.v1)) return false;

  // ts llega en milisegundos o en segundos según la versión; se aceptan ambos.
  const n = Number(firma.ts);
  const tsMs = n > 1e12 ? n : n * 1000;
  const tolerancia = p.toleranciaMs ?? 5 * 60_000;
  if (Math.abs((p.ahoraMs ?? Date.now()) - tsMs) > tolerancia) return false;

  const esperado = createHmac("sha256", p.secreto).update(manifiestoFirma(p.dataId, p.xRequestId, firma.ts)).digest();
  const recibido = Buffer.from(firma.v1, "hex");
  return recibido.length === esperado.length && timingSafeEqual(recibido, esperado);
}
