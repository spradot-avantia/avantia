import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { manifiestoFirma, parsearXSignature, verificarFirmaMercadoPago } from "./firma";
import { evaluarPago, type PagoMercadoPago } from "./reglas";

const SECRETO = "secreto-de-prueba";
const AHORA = 1_763_550_000_000;

function firmar(dataId: string, requestId: string, tsMs: number, secreto = SECRETO) {
  const ts = String(tsMs);
  const v1 = createHmac("sha256", secreto).update(manifiestoFirma(dataId, requestId, ts)).digest("hex");
  return `ts=${ts},v1=${v1}`;
}

describe("firma del webhook de Mercado Pago", () => {
  it("parsea la cabecera x-signature", () => {
    expect(parsearXSignature("ts=1,v1=abc")).toEqual({ ts: "1", v1: "abc" });
    expect(parsearXSignature("v1=abc")).toBeNull();
    expect(parsearXSignature(null)).toBeNull();
  });

  it("acepta una firma válida y reciente", () => {
    const xSignature = firmar("123456", "req-1", AHORA - 1000);
    expect(verificarFirmaMercadoPago({ xSignature, xRequestId: "req-1", dataId: "123456", secreto: SECRETO, ahoraMs: AHORA })).toBe(true);
  });

  it("acepta ts en segundos", () => {
    const ts = String(Math.floor(AHORA / 1000));
    const v1 = createHmac("sha256", SECRETO).update(manifiestoFirma("9", "r", ts)).digest("hex");
    expect(verificarFirmaMercadoPago({ xSignature: `ts=${ts},v1=${v1}`, xRequestId: "r", dataId: "9", secreto: SECRETO, ahoraMs: AHORA })).toBe(true);
  });

  it("rechaza firma con otra clave, otro id u otro request-id", () => {
    const base = { xRequestId: "req-1", dataId: "123456", secreto: SECRETO, ahoraMs: AHORA };
    expect(verificarFirmaMercadoPago({ ...base, xSignature: firmar("123456", "req-1", AHORA, "otra") })).toBe(false);
    expect(verificarFirmaMercadoPago({ ...base, xSignature: firmar("999", "req-1", AHORA) })).toBe(false);
    expect(verificarFirmaMercadoPago({ ...base, xSignature: firmar("123456", "req-2", AHORA) })).toBe(false);
  });

  it("rechaza firma vencida (más de 5 minutos)", () => {
    const xSignature = firmar("123456", "req-1", AHORA - 6 * 60_000);
    expect(verificarFirmaMercadoPago({ xSignature, xRequestId: "req-1", dataId: "123456", secreto: SECRETO, ahoraMs: AHORA })).toBe(false);
  });

  it("sin secreto configurado no acepta nada", () => {
    const xSignature = firmar("123456", "req-1", AHORA);
    expect(verificarFirmaMercadoPago({ xSignature, xRequestId: "req-1", dataId: "123456", secreto: undefined, ahoraMs: AHORA })).toBe(false);
  });
});

describe("evaluarPago", () => {
  const esperado = { inscripcionId: "insc-1", tenantId: "t-1", montoCentavos: 1_999_000 };
  const aprobado: PagoMercadoPago = {
    id: "1",
    status: "approved",
    transaction_amount: 19990,
    currency_id: "CLP",
    external_reference: "insc-1",
    metadata: { tenant_id: "t-1" },
  };

  it("aprobado, mismo monto, moneda y academia → ok", () => {
    expect(evaluarPago(aprobado, esperado)).toEqual({ ok: true });
  });
  it("monto distinto → no activa", () => {
    expect(evaluarPago({ ...aprobado, transaction_amount: 100 }, esperado)).toEqual({ ok: false, motivo: "monto" });
  });
  it("otra moneda → no activa", () => {
    expect(evaluarPago({ ...aprobado, currency_id: "ARS" }, esperado)).toEqual({ ok: false, motivo: "moneda" });
  });
  it("rechazado o pendiente → no activa", () => {
    expect(evaluarPago({ ...aprobado, status: "rejected" }, esperado)).toEqual({ ok: false, motivo: "rechazado" });
    expect(evaluarPago({ ...aprobado, status: "in_process" }, esperado)).toEqual({ ok: false, motivo: "pendiente" });
  });
  it("pago de otra academia no acredita una inscripción ajena", () => {
    expect(evaluarPago({ ...aprobado, metadata: { tenant_id: "t-otro" } }, esperado)).toEqual({ ok: false, motivo: "tenant" });
    expect(evaluarPago({ ...aprobado, external_reference: "insc-otra" }, esperado)).toEqual({ ok: false, motivo: "referencia" });
  });
  it("curso gratis nunca se acredita por pasarela", () => {
    expect(evaluarPago(aprobado, { ...esperado, montoCentavos: 0 })).toEqual({ ok: false, motivo: "monto" });
  });
});
