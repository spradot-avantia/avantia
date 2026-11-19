import { beforeEach, describe, expect, it, vi } from "vitest";

// La ruta debe tomar la academia de la sesión y nunca del body.
const ctx = vi.hoisted(() => ({ valor: null as unknown }));
vi.mock("../../../../lib/creador/tenantActual", () => ({ getCreadorContext: async () => ctx.valor }));
vi.mock("../../../../lib/tenant/resolve", () => ({ dominiosRaizTenant: () => ["goavantia.com"] }));

import { POST } from "./route";

function peticion(body: unknown) {
  return new Request("http://localhost/api/tenants/domain", { method: "POST", body: JSON.stringify(body) });
}

function dbFalsa(resultado: { data: unknown; error: unknown }) {
  const llamadas: Array<[string, unknown]> = [];
  const q = {
    from: (t: string) => (llamadas.push(["from", t]), q),
    update: (v: unknown) => (llamadas.push(["update", v]), q),
    eq: (c: string, v: unknown) => (llamadas.push([`eq:${c}`, v]), q),
    select: () => q,
    maybeSingle: async () => resultado,
  };
  return { db: q, llamadas };
}

describe("POST /api/tenants/domain", () => {
  beforeEach(() => {
    ctx.valor = null;
  });

  it("sin sesión responde 401", async () => {
    const res = await POST(peticion({ tenantId: "otro", domain: "x.cl" }));
    expect(res.status).toBe(401);
  });

  it("el modo demo tampoco puede escribir", async () => {
    ctx.valor = { modo: "demo", tenant: { id: "t-demo" }, db: dbFalsa({ data: null, error: null }).db };
    expect((await POST(peticion({ domain: "x.cl" }))).status).toBe(401);
  });

  it("ignora el tenantId del body y escribe en la academia de la sesión", async () => {
    const f = dbFalsa({ data: { id: "t-propio" }, error: null });
    ctx.valor = { modo: "sesion", tenant: { id: "t-propio" }, db: f.db };
    const res = await POST(peticion({ tenantId: "t-ajeno", domain: "FinanzasClaras.cl" }));
    expect(res.status).toBe(200);
    expect(f.llamadas).toContainEqual(["eq:id", "t-propio"]);
    expect(f.llamadas).not.toContainEqual(["eq:id", "t-ajeno"]);
    expect(f.llamadas).toContainEqual(["update", { custom_domain: "finanzasclaras.cl" }]);
  });

  it("rechaza dominios de la plataforma", async () => {
    ctx.valor = { modo: "sesion", tenant: { id: "t" }, db: dbFalsa({ data: { id: "t" }, error: null }).db };
    expect((await POST(peticion({ domain: "otra.goavantia.com" }))).status).toBe(400);
  });

  it("dominio ya usado por otra academia → 409", async () => {
    ctx.valor = { modo: "sesion", tenant: { id: "t" }, db: dbFalsa({ data: null, error: { code: "23505" } }).db };
    expect((await POST(peticion({ domain: "usado.cl" }))).status).toBe(409);
  });
});
