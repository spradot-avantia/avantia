import { describe, expect, it } from "vitest";
import {
  CONTENIDO_VACIO,
  contenidoDesdeJson,
  contenidoSchema,
  estadoPagina,
  pendientesPagina,
  puntajeEncuesta,
  razonesEncuesta,
  registrosDns,
  testimonioSchema,
  validarDominio,
  validarMetaPortada,
  type ContenidoPagina,
} from "./paginaReglas";
import { construirDatosSitio, destinoAccion, formatearPrecio, resumenCurso, type CursoSitio } from "../sitio/tipos";

const completo: ContenidoPagina = {
  ...CONTENIDO_VACIO,
  template: "programa",
  titulo: "Negociar contratos",
  bajada: "Un curso corto con casos reales.",
  bioNombre: "Carolina",
  bioTexto: "20 años en abastecimiento.",
  ejemploTestimoniosQuitado: true,
};

describe("pendientes de la página", () => {
  it("una página nueva tiene template y 5 partes de ejemplo pendientes", () => {
    expect(pendientesPagina(CONTENIDO_VACIO).map((p) => p.campo)).toEqual([
      "template",
      "titulo",
      "bajada",
      "bioNombre",
      "bioTexto",
      "testimonios",
    ]);
  });
  it("sin pendientes cuando todo está escrito y se quitaron los testimonios de ejemplo", () => {
    expect(pendientesPagina(completo)).toEqual([]);
  });
  it("un testimonio real reemplaza a los de ejemplo", () => {
    const c = { ...completo, ejemploTestimoniosQuitado: false, testimonios: [{ nombre: "Ana · Jefa", texto: "Muy útil para el equipo.", autorizadoAt: "x" }] };
    expect(pendientesPagina(c)).toEqual([]);
  });
});

describe("estado de publicación", () => {
  it("sin publicar, publicada y con cambios", () => {
    expect(estadoPagina({ contenido: completo, publicado: null })).toBe("sin_publicar");
    expect(estadoPagina({ contenido: completo, publicado: { ...completo } })).toBe("publicada");
    expect(estadoPagina({ contenido: { ...completo, titulo: "Otro" }, publicado: completo })).toBe("cambios_sin_publicar");
  });
  it("el orden de los cursos ocultos no cuenta como cambio", () => {
    const a = { ...completo, cursosOcultos: ["b", "a"] };
    expect(estadoPagina({ contenido: a, publicado: { ...completo, cursosOcultos: ["a", "b"] } })).toBe("publicada");
  });
  it("lee la copia publicada aunque venga con testimonios en snake_case", () => {
    const c = contenidoDesdeJson({ ...completo, testimonios: [{ nombre: "Ana", texto: "Muy bueno", autorizado_at: "2026-11-03" }] });
    expect(c?.testimonios[0]).toEqual({ nombre: "Ana", texto: "Muy bueno", autorizadoAt: "2026-11-03" });
    expect(contenidoDesdeJson(null)).toBeNull();
  });
});

describe("validación del contenido", () => {
  it("vacío o espacios se guarda como null", () => {
    const p = contenidoSchema.safeParse({ titulo: "   " });
    expect(p.success && p.data.titulo).toBe(null);
  });
  it("rechaza campos desconocidos y textos largos", () => {
    expect(contenidoSchema.safeParse({ template: "programa" }).success).toBe(false);
    expect(contenidoSchema.safeParse({ titulo: "x".repeat(91) }).success).toBe(false);
  });
  it("el testimonio exige autorización", () => {
    expect(testimonioSchema.safeParse({ nombre: "Ana · Jefa", texto: "Me sirvió mucho.", autorizado: false }).success).toBe(false);
    expect(testimonioSchema.safeParse({ nombre: "Ana · Jefa", texto: "Me sirvió mucho.", autorizado: true }).success).toBe(true);
  });
});

describe("encuesta", () => {
  it("sin respuestas no hay puntos", () => {
    expect(puntajeEncuesta([null, null, null, null, null]).total).toBe(0);
  });
  it("empresas + taller + resultados -> Consultor", () => {
    const r = puntajeEncuesta([2, 2, 2, 2, 2]);
    expect(r.orden[0]).toBe("consultor");
    expect(razonesEncuesta([2, 2, 2, 2, 2], "consultor")).toHaveLength(5);
  });
  it("público interesado + lecciones grabadas -> Maestro", () => {
    expect(puntajeEncuesta([1, 1, 1, 0, 1]).orden[0]).toBe("maestro");
  });
  it("en empate decide la primera respuesta", () => {
    // Programa 3 (grupo) empata con Maestro 3 (lección gratis): sin comprador gana Programa...
    expect(puntajeEncuesta([null, 0, null, null, 1]).orden[0]).toBe("programa");
    // ...y si el comprador es "personas interesadas" (suma a Maestro), gana Maestro.
    expect(puntajeEncuesta([1, 0, null, 0, null]).orden[0]).toBe("maestro");
  });
});

describe("dominio propio", () => {
  it("limpia y valida", () => {
    expect(validarDominio(" https://Academia.MiSitio.cl/ ", "avantia.app")).toEqual({ ok: true, dominio: "academia.misitio.cl" });
    expect(validarDominio("mi sitio.cl", "avantia.app").ok).toBe(false);
    expect(validarDominio("", "avantia.app").ok).toBe(false);
  });
  it("rechaza el dominio de la plataforma", () => {
    expect(validarDominio("juan.avantia.app", "avantia.app").ok).toBe(false);
    expect(validarDominio("avantia.app", "avantia.app").ok).toBe(false);
  });
  it("subdominio usa CNAME; dominio raíz usa A", () => {
    const sub = registrosDns("academia.misitio.cl", "abc");
    expect(sub[0]).toMatchObject({ tipo: "CNAME", nombre: "academia" });
    expect(sub[1]).toMatchObject({ tipo: "TXT", nombre: "_avantia.academia", valor: "avantia-verificacion=abc" });
    const raiz = registrosDns("misitio.cl", "abc");
    expect(raiz[0]).toMatchObject({ tipo: "A", nombre: "@" });
    expect(raiz[1].nombre).toBe("_avantia");
  });
});

describe("foto de portada", () => {
  it("exige JPG/PNG/WebP horizontal de 1.200 px y hasta 2 MB", () => {
    expect(validarMetaPortada({ tipo: "image/jpeg", bytes: 500_000, ancho: 1600, alto: 900 })).toBeNull();
    expect(validarMetaPortada({ tipo: "image/svg+xml", bytes: 100, ancho: 2000, alto: 1000 })).not.toBeNull();
    expect(validarMetaPortada({ tipo: "image/png", bytes: 500_000, ancho: 1000, alto: 600 })).not.toBeNull();
    expect(validarMetaPortada({ tipo: "image/png", bytes: 500_000, ancho: 1200, alto: 1600 })).not.toBeNull();
    expect(validarMetaPortada({ tipo: "image/png", bytes: 3_000_000, ancho: 1600, alto: 900 })).not.toBeNull();
  });
});

const curso = (id: string, extra: Partial<CursoSitio> = {}): CursoSitio => ({
  id,
  slug: `curso-${id}`,
  titulo: `Curso ${id}`,
  descripcion: null,
  modalidad: "a_su_ritmo",
  fechaInicio: null,
  precio: "Gratis",
  totalModulos: 3,
  totalLecciones: 5,
  ...extra,
});
const academia = { nombre: "Contratos Mineros", frase: "Frase", colorPrimario: "#0f766e", logoUrl: null, logoModo: "logo_y_nombre" as const };

describe("datos del sitio", () => {
  it("la vista previa completa con el ejemplo y lo marca", () => {
    const d = construirDatosSitio({ contenido: CONTENIDO_VACIO, template: "maestro", academia, cursos: [], modo: "vista" });
    expect(d.ejemplo.titulo).toBe(true);
    expect(d.titulo).toBe("Aprende vino con quien lo hace.");
    expect(d.testimonios.length).toBeGreaterThan(0);
    expect(d.cifra).not.toBeNull();
  });
  it("el sitio público nunca muestra contenido de ejemplo", () => {
    const d = construirDatosSitio({ contenido: CONTENIDO_VACIO, template: "maestro", academia, cursos: [], modo: "publico" });
    expect(Object.values(d.ejemplo).some(Boolean)).toBe(false);
    expect(d.titulo).toBe("Contratos Mineros");
    expect(d.testimonios).toHaveLength(0);
  });
  it("oculta los cursos que el creador desmarcó", () => {
    const d = construirDatosSitio({ contenido: { ...completo, cursosOcultos: ["2"] }, template: "programa", academia, cursos: [curso("1"), curso("2")], modo: "publico" });
    expect(d.cursos.map((c) => c.id)).toEqual(["1"]);
    expect(destinoAccion(d)).toBe("/curso/curso-1");
  });
  it("precio y resumen", () => {
    expect(formatearPrecio(32000000, "CLP")).toMatch(/320\.000/);
    expect(formatearPrecio(0, "CLP")).toBe("Gratis");
    expect(resumenCurso(curso("1"))).toBe("A su ritmo · 3 módulos · 5 lecciones");
  });
});