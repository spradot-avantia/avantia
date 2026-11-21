import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const acreditar = vi.hoisted(() => vi.fn(async () => ({ estado: "aprobado" })));
vi.mock("../../../../lib/pagos/acreditar", () => ({ acreditarPago: acreditar }));

import { manifiestoFirma } from "../../../../lib/pagos/firma";
import { POST } from "./route";

const SECRETO = "s3cr3to";

function peticion(dataId: string, firma: string | null, body: unknown = { type: "payment", data: { id: dataId } }) {
  const headers: Record<string, string> = { "x-request-id": "req-1", "content-type": "application/json" };
  if (firma) headers["x-signature"] = firma;
  return new Request(`https://x.test/api/webhooks/mercadopago?data.id=${dataId}&type=payment`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

const firmar = (dataId: string, secreto = SECRETO) => {
  const ts = String(Date.now());
  return `ts=${ts},v1=${createHmac("sha256", secreto).update(manifiestoFirma(dataId, "req-1", ts)).digest("hex")}`;
};

describe("POST /api/webhooks/mercadopago", () => {
  beforeEach(() => {
    process.env.MERCADOPAGO_WEBHOOK_SECRET = SECRETO;
    process.env.MERCADOPAGO_ACCESS_TOKEN = "TEST-token";
    delete process.env.PAGOS_HABILITADOS;
    acreditar.mockClear();
  });

  it("pasarela apagada (sin token) → 404 y no acredita, aunque la firma sea válida", async () => {
    delete process.env.MERCADOPAGO_ACCESS_TOKEN;
    expect((await POST(peticion("123", firmar("123")))).status).toBe(404);
    expect(acreditar).not.toHaveBeenCalled();
  });

  it("PAGOS_HABILITADOS=false → 404 aunque haya token", async () => {
    process.env.PAGOS_HABILITADOS = "false";
    expect((await POST(peticion("123", firmar("123")))).status).toBe(404);
    expect(acreditar).not.toHaveBeenCalled();
  });

  it("sin firma → 401 y no acredita", async () => {
    expect((await POST(peticion("123", null))).status).toBe(401);
    expect(acreditar).not.toHaveBeenCalled();
  });

  it("firma falsa → 401", async () => {
    expect((await POST(peticion("123", firmar("123", "otra-clave")))).status).toBe(401);
    expect(acreditar).not.toHaveBeenCalled();
  });

  it("firma válida → 200 y acredita el id firmado", async () => {
    const res = await POST(peticion("123", firmar("123")));
    expect(res.status).toBe(200);
    expect(acreditar).toHaveBeenCalledWith("123");
  });

  it("id del cuerpo distinto al firmado → 400", async () => {
    const res = await POST(peticion("123", firmar("123"), { type: "payment", data: { id: "999" } }));
    expect(res.status).toBe(400);
    expect(acreditar).not.toHaveBeenCalled();
  });
});
