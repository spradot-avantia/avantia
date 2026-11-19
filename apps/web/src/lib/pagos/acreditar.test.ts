import { beforeEach, describe, expect, it, vi } from "vitest";

// Base en memoria con lo mínimo que usa acreditarPago (select/eq/maybeSingle, upsert, update).
type Fila = Record<string, unknown>;
const tablas = vi.hoisted(() => ({ datos: {} as Record<string, Fila[]> }));

vi.mock("../alumno/eventos", () => ({ registrarEvento: vi.fn(async () => undefined) }));
vi.mock("../mercadopago", () => ({ getMercadopagoClient: () => ({}) }));
vi.mock("../supabase/admin", () => {
  function consulta(tabla: string) {
    const filtros: Array<[string, unknown]> = [];
    let patch: Fila | null = null;
    const coincide = (f: Fila) => filtros.every(([c, v]) => f[c] === v);
    const q = {
      select: () => q,
      eq: (c: string, v: unknown) => (filtros.push([c, v]), q),
      maybeSingle: async () => ({ data: tablas.datos[tabla].find(coincide) ?? null, error: null }),
      update: (p: Fila) => ((patch = p), q),
      upsert: (fila: Fila, opt: { onConflict: string }) => {
        const claves = opt.onConflict.split(",");
        const existe = tablas.datos[tabla].some((f) => claves.every((k) => f[k] === fila[k]));
        if (!existe) tablas.datos[tabla].push({ id: `p${tablas.datos[tabla].length + 1}`, ...fila });
        return { select: async () => ({ data: existe ? [] : [{ id: "nuevo" }], error: null }) };
      },
      then: (res: (v: unknown) => void) => {
        const afectadas = tablas.datos[tabla].filter(coincide);
        if (patch) for (const f of afectadas) Object.assign(f, patch);
        res({ data: afectadas.map((f) => ({ id: f.id })), error: null });
      },
    };
    return q;
  }
  return { supabaseAdmin: { from: consulta } };
});

import { acreditarPago } from "./acreditar";
import type { PagoMercadoPago } from "./reglas";

const T = "11111111-1111-4111-8111-111111111111";
const T_OTRO = "22222222-2222-4222-8222-222222222222";
const INSC = "33333333-3333-4333-8333-333333333333";

const pago = (over: Partial<PagoMercadoPago> = {}): PagoMercadoPago => ({
  id: "1234567890",
  status: "approved",
  transaction_amount: 19990,
  currency_id: "CLP",
  external_reference: INSC,
  metadata: { tenant_id: T },
  ...over,
});

beforeEach(() => {
  tablas.datos = {
    inscripciones: [{ id: INSC, tenant_id: T, curso_id: "c1", alumno_id: "a1", estado: "pendiente" }],
    cursos: [{ id: "c1", tenant_id: T, precio_centavos: 1_999_000 }],
    pagos: [],
  };
});

describe("acreditarPago", () => {
  it("aprobado: registra un pago y activa la inscripción", async () => {
    const r = await acreditarPago("1234567890", { obtenerPago: async () => pago() });
    expect(r).toMatchObject({ estado: "aprobado", nuevo: true, tenantId: T, cursoId: "c1" });
    expect(tablas.datos.pagos).toHaveLength(1);
    expect(tablas.datos.pagos[0]).toMatchObject({ medio: "pasarela", registrado_por: "pasarela", referencia_externa: "1234567890", monto_centavos: 1_999_000 });
    expect(tablas.datos.inscripciones[0]).toMatchObject({ estado: "activa", activada_por: "pago" });
  });

  it("doble llamada (retorno + webhook) no duplica el pago", async () => {
    await acreditarPago("1234567890", { obtenerPago: async () => pago() });
    const r2 = await acreditarPago("1234567890", { obtenerPago: async () => pago() });
    expect(r2).toMatchObject({ estado: "aprobado", nuevo: false });
    expect(tablas.datos.pagos).toHaveLength(1);
  });

  it("rechazado: la inscripción sigue pendiente", async () => {
    const r = await acreditarPago("1234567890", { obtenerPago: async () => pago({ status: "rejected" }) });
    expect(r.estado).toBe("rechazado");
    expect(tablas.datos.pagos).toHaveLength(0);
    expect(tablas.datos.inscripciones[0].estado).toBe("pendiente");
  });

  it("monto distinto: no activa", async () => {
    const r = await acreditarPago("1234567890", { obtenerPago: async () => pago({ transaction_amount: 10 }) });
    expect(r).toEqual({ estado: "invalido", motivo: "monto" });
    expect(tablas.datos.inscripciones[0].estado).toBe("pendiente");
  });

  it("pago con metadata de otra academia no encuentra la inscripción ajena", async () => {
    const r = await acreditarPago("1234567890", { obtenerPago: async () => pago({ metadata: { tenant_id: T_OTRO } }) });
    expect(r.estado).toBe("invalido");
    expect(tablas.datos.pagos).toHaveLength(0);
  });

  it("id de pago no numérico ni consulta a Mercado Pago", async () => {
    const obtener = vi.fn(async () => pago());
    expect((await acreditarPago("abc;drop", { obtenerPago: obtener })).estado).toBe("invalido");
    expect(obtener).not.toHaveBeenCalled();
  });
});
