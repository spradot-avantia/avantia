import { describe, expect, it } from "vitest";
import {
  aparienciaSchema,
  descripcionLeccion,
  descripcionModulo,
  duracionMin,
  objetivosModulo,
  inspeccionarLogo,
  notaMaterial,
  tituloMaterial,
  tipoMaterial,
  validarUrlMaterial,
  parsearCorreos,
  sanitizarSvg,
  slugify,
  urlEmbebible,
  validarCampoCurso,
  validarFechas,
  validarMetaLogo,
  validarUrlLeccion,
} from "./validacion";
import { iniciales, textoSobre } from "./color";
import { validarPublicacion } from "./reglasPublicacion";
import type { CursoCompleto } from "./types";

describe("campos de curso", () => {
  it("título 5-80", () => {
    expect(validarCampoCurso("titulo", "abcd").ok).toBe(false);
    expect(validarCampoCurso("titulo", "  Curso bueno ").ok).toBe(true);
    expect(validarCampoCurso("titulo", "x".repeat(81)).ok).toBe(false);
  });
  it("descripción 50-400", () => {
    expect(validarCampoCurso("descripcion", "corta").ok).toBe(false);
    expect(validarCampoCurso("descripcion", "d".repeat(50)).ok).toBe(true);
    expect(validarCampoCurso("descripcion", "d".repeat(401)).ok).toBe(false);
  });
  it("objetivos 1-3", () => {
    expect(validarCampoCurso("objetivos", []).ok).toBe(false);
    expect(validarCampoCurso("objetivos", ["a", "b", "c"]).ok).toBe(true);
    expect(validarCampoCurso("objetivos", ["a", "b", "c", "d"]).ok).toBe(false);
  });
  it("fechas", () => {
    expect(validarFechas("2026-11-01", "2026-10-01")).not.toBeNull();
    expect(validarFechas("2026-11-01", "2026-12-01")).toBeNull();
  });
});

describe("urls", () => {
  it("acepta lista blanca", () => {
    expect(validarUrlLeccion("video", "https://youtu.be/dQw4w9WgXcQ").ok).toBe(true);
    expect(validarUrlLeccion("video", "https://vimeo.com/123456789").ok).toBe(true);
    expect(validarUrlLeccion("documento", "https://docs.google.com/document/d/abc/edit").ok).toBe(true);
    expect(validarUrlLeccion("video", "https://drive.google.com/file/d/abc123/view").ok).toBe(true);
  });
  it("documento acepta cualquier https", () => {
    for (const u of [
      "https://www.dropbox.com/s/abc/guia.pdf",
      "https://1drv.ms/b/s!abc",
      "https://www.notion.so/guia-123",
      "https://www.canva.com/design/abc/view",
      "https://mi-sitio.cl/guia.pdf",
    ]) {
      const r = validarUrlLeccion("documento", u);
      expect(r.ok).toBe(true);
    }
    const r = validarUrlLeccion("documento", "https://mi-sitio.cl/guia.pdf");
    expect(r.ok && r.proveedor).toBe("otro");
  });
  it("documento sigue exigiendo https", () => {
    expect(validarUrlLeccion("documento", "http://mi-sitio.cl/x").ok).toBe(false);
    expect(validarUrlLeccion("documento", "javascript:alert(1)").ok).toBe(false);
    expect(validarUrlLeccion("documento", "https://user:pw@mi-sitio.cl/x").ok).toBe(false);
    expect(validarUrlLeccion("documento", "no es un enlace").ok).toBe(false);
  });
  it("video Drive solo si es un archivo válido", () => {
    expect(validarUrlLeccion("video", "https://drive.google.com/drive/folders/abc").ok).toBe(false);
    expect(validarUrlLeccion("video", "https://youtube.com/@canal").ok).toBe(false);
  });
  it("rechaza lo demás", () => {
    expect(validarUrlLeccion("video", "http://youtu.be/x").ok).toBe(false);
    expect(validarUrlLeccion("video", "https://evil.com/youtube.com").ok).toBe(false);
    expect(validarUrlLeccion("video", "https://youtube.com@evil.com/").ok).toBe(false);
    expect(validarUrlLeccion("video", "javascript:alert(1)").ok).toBe(false);
    expect(validarUrlLeccion("video", "https://www.dropbox.com/s/abc/video.mp4").ok).toBe(false);
  });
  it("embebible", () => {
    expect(urlEmbebible("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toContain("/embed/dQw4w9WgXcQ");
    expect(urlEmbebible("https://vimeo.com/123456789")).toBe("https://player.vimeo.com/video/123456789");
  });
});

describe("correos", () => {
  it("separa válidos, inválidos y duplicados", () => {
    const r = parsearCorreos("A@x.com, a@x.com;malo\nb@y.cl");
    expect(r.validos).toEqual(["a@x.com", "b@y.cl"]);
    expect(r.invalidos).toEqual(["malo"]);
  });
});

describe("logo", () => {
  it("meta", () => {
    expect(validarMetaLogo({ tipo: "image/gif", bytes: 1, ancho: 200, alto: 200 })).not.toBeNull();
    expect(validarMetaLogo({ tipo: "image/png", bytes: 3_000_000, ancho: 200, alto: 200 })).not.toBeNull();
    expect(validarMetaLogo({ tipo: "image/png", bytes: 1000, ancho: 100, alto: 200 })).not.toBeNull();
    expect(validarMetaLogo({ tipo: "image/png", bytes: 1000, ancho: 128, alto: 128 })).toBeNull();
  });
  it("sanitiza SVG con scripts y handlers", () => {
    const sucio = `<svg viewBox="0 0 200 200" onload="x()"><script>alert(1)</script><a href="javascript:x"><rect width="200" height="200" onclick="y()"/></a></svg>`;
    const limpio = sanitizarSvg(sucio) as string;
    expect(limpio).not.toMatch(/script|onload|onclick|javascript/i);
    expect(limpio).toContain("<rect");
  });
  it("rechaza lo que no es svg", () => {
    expect(sanitizarSvg("<html></html>")).toBeNull();
  });
  it("inspecciona SVG y PNG", () => {
    const chico = new TextEncoder().encode(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 100"><rect width="400" height="100"/></svg>`);
    expect(inspeccionarLogo(chico, "image/svg+xml").ok).toBe(false);
    const ancho = new TextEncoder().encode(`<svg viewBox="0 0 400 200"><rect width="4" height="4"/></svg>`);
    const r = inspeccionarLogo(ancho, "image/svg+xml");
    expect(r.ok && r.modoSugerido).toBe("solo_logo");
    const png = new Uint8Array(32);
    png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    new DataView(png.buffer).setUint32(16, 256);
    new DataView(png.buffer).setUint32(20, 256);
    expect(inspeccionarLogo(png, "image/png").ok).toBe(true);
    expect(inspeccionarLogo(png, "image/svg+xml").ok).toBe(false);
  });
});

describe("utilidades", () => {
  it("slug e iniciales", () => {
    expect(slugify("Contratos Mineros: ¡Guía!")).toBe("contratos-mineros-guia");
    expect(iniciales("Contratos Mineros")).toBe("CM");
    expect(iniciales("Avantia")).toBe("AV");
  });
  it("texto con contraste", () => {
    expect(textoSobre("#0a1029")).toBe("#ffffff");
    expect(textoSobre("#fde68a")).toBe("#0a1029");
  });
});

function cursoBase(over: Partial<CursoCompleto> = {}): CursoCompleto {
  return {
    id: "c",
    slug: "c",
    titulo: "Curso válido",
    descripcion: "d".repeat(60),
    publico: null,
    estado: "borrador",
    modalidad: "a_su_ritmo",
    fechaInicio: null,
    fechaTermino: null,
    acceso: "enlace",
    publishedAt: null,
    createdAt: "",
    updatedAt: "",
    objetivos: ["Algo"],
    modulos: [
      {
        id: "m",
        cursoId: "c",
        titulo: "M1",
        orden: 0,
        descripcion: null,
        objetivos: [],
        materiales: [],
        duracionMin: null,
        lecciones: [
          { id: "l", moduloId: "m", cursoId: "c", titulo: "L1", tipo: "texto", contenidoUrl: null, contenidoTexto: "hola", storagePath: null, contenidoTipo: null, descripcion: null, duracionMin: null, orden: 0 },
        ],
      },
    ],
    ...over,
  };
}

describe("validarPublicacion", () => {
  it("curso completo puede publicarse", () => {
    expect(validarPublicacion(cursoBase()).puedePublicar).toBe(true);
  });
  it("lista bloqueos con paso", () => {
    const r = validarPublicacion(cursoBase({ titulo: "ab", descripcion: "x", objetivos: [], modulos: [] }));
    expect(r.puedePublicar).toBe(false);
    expect(r.bloqueos.map((b) => b.paso)).toEqual(expect.arrayContaining(["esencial", "objetivo", "estructura"]));
  });
  it("con fechas exige fechas", () => {
    const r = validarPublicacion(cursoBase({ modalidad: "con_fechas" }));
    expect(r.bloqueos.some((b) => b.paso === "modalidad")).toBe(true);
  });
});

describe("apariencia de la academia (ADR 027)", () => {
  it("acepta tipografías y formas de la lista cerrada", () => {
    expect(aparienciaSchema.safeParse({ tipografia: "editorial", forma: "recta" }).success).toBe(true);
    expect(aparienciaSchema.safeParse({}).success).toBe(true);
  });
  it("rechaza valores fuera de la lista (el servidor manda)", () => {
    expect(aparienciaSchema.safeParse({ tipografia: "comic-sans" }).success).toBe(false);
    expect(aparienciaSchema.safeParse({ forma: "redonda" }).success).toBe(false);
    expect(aparienciaSchema.safeParse({ tipografia: "clasico'; drop table tenants;--" }).success).toBe(false);
    const r = aparienciaSchema.safeParse({ forma: "x" });
    expect(!r.success && r.error.issues[0]?.message).toBe("Elige una de las formas disponibles.");
  });
});


describe("módulos enriquecidos (ADR 029)", () => {
  it("descripción del módulo: opcional, hasta 600, vacío = null", () => {
    expect(descripcionModulo.parse("")).toBeNull();
    expect(descripcionModulo.parse("   ")).toBeNull();
    expect(descripcionModulo.parse("  Qué es un dato  ")).toBe("Qué es un dato");
    expect(descripcionModulo.safeParse("x".repeat(600)).success).toBe(true);
    expect(descripcionModulo.safeParse("x".repeat(601)).success).toBe(false);
  });
  it("descripción de la lección: hasta 400", () => {
    expect(descripcionLeccion.parse("")).toBeNull();
    expect(descripcionLeccion.safeParse("x".repeat(400)).success).toBe(true);
    expect(descripcionLeccion.safeParse("x".repeat(401)).success).toBe(false);
  });
  it("«Qué aprenderás»: 0 a 4 puntos de 1 a 140 caracteres, sin vacíos", () => {
    expect(objetivosModulo.safeParse([]).success).toBe(true);
    expect(objetivosModulo.safeParse(["a", "b", "c", "d"]).success).toBe(true);
    expect(objetivosModulo.safeParse(["a", "b", "c", "d", "e"]).success).toBe(false);
    expect(objetivosModulo.safeParse(["a", "   "]).success).toBe(false);
    expect(objetivosModulo.safeParse(["x".repeat(140)]).success).toBe(true);
    expect(objetivosModulo.safeParse(["x".repeat(141)]).success).toBe(false);
    expect(objetivosModulo.parse(["  Limpiar datos  "])).toEqual(["Limpiar datos"]);
  });
  it("duración: entero de 1 a 1.440 o null", () => {
    expect(duracionMin.safeParse(null).success).toBe(true);
    expect(duracionMin.safeParse(1).success).toBe(true);
    expect(duracionMin.safeParse(1440).success).toBe(true);
    expect(duracionMin.safeParse(0).success).toBe(false);
    expect(duracionMin.safeParse(1441).success).toBe(false);
    expect(duracionMin.safeParse(12.5).success).toBe(false);
    expect(duracionMin.safeParse(Number.NaN).success).toBe(false);
  });
  it("los campos nuevos no bloquean la publicación", () => {
    const base = validarPublicacion({
      id: "c", slug: "s", titulo: "Curso de prueba", descripcion: "d".repeat(60), publico: null, estado: "borrador",
      modalidad: "a_su_ritmo", fechaInicio: null, fechaTermino: null, acceso: "invitados", publishedAt: null, createdAt: "", updatedAt: "",
      objetivos: ["Algo"],
      modulos: [
        {
          id: "m", cursoId: "c", titulo: "M1", orden: 0, descripcion: null, objetivos: [], duracionMin: null, materiales: [],
          lecciones: [
            { id: "l", moduloId: "m", cursoId: "c", titulo: "L1", tipo: "texto", contenidoUrl: null, contenidoTexto: "hola", storagePath: null, contenidoTipo: null, descripcion: null, duracionMin: null, orden: 0 },
          ],
        },
      ],
    } as CursoCompleto);
    expect(base.bloqueos.some((b) => /descripci|duraci|aprender|punto/i.test(b.mensaje))).toBe(false);
  });
});

describe("materiales (ADR 029, F2)", () => {
  it("acepta enlaces https de cualquier servicio", () => {
    for (const u of ["https://drive.google.com/file/d/abc/view", "https://www.notion.so/pagina-123", "https://ejemplo.cl/guia.pdf?v=2"]) {
      expect(validarUrlMaterial(u).ok).toBe(true);
    }
  });
  it("rechaza http, otros esquemas, credenciales y texto suelto", () => {
    for (const u of ["http://ejemplo.cl", "javascript:alert(1)", "data:text/html,hola", "ftp://x.cl/a", "https://usuario:clave@ejemplo.cl", "ejemplo.cl", ""]) {
      expect(validarUrlMaterial(u).ok).toBe(false);
    }
  });
  it("rechaza URL de más de 2.000 caracteres", () => {
    expect(validarUrlMaterial("https://ejemplo.cl/" + "a".repeat(2000)).ok).toBe(false);
  });
  it("el título es obligatorio y admite hasta 120 caracteres", () => {
    expect(tituloMaterial.safeParse("   ").success).toBe(false);
    expect(tituloMaterial.safeParse("a".repeat(121)).success).toBe(false);
    expect(tituloMaterial.safeParse("  Guía de estilo  ")).toMatchObject({ success: true, data: "Guía de estilo" });
  });
  it("la nota es opcional: vacío es null y admite hasta 200", () => {
    expect(notaMaterial.parse("   ")).toBeNull();
    expect(notaMaterial.parse(" Lee las páginas 3 a 5 ")).toBe("Lee las páginas 3 a 5");
    expect(notaMaterial.safeParse("a".repeat(201)).success).toBe(false);
  });
  it("el tipo es documento o enlace", () => {
    expect(tipoMaterial.safeParse("documento").success).toBe(true);
    expect(tipoMaterial.safeParse("enlace").success).toBe(true);
    expect(tipoMaterial.safeParse("video").success).toBe(false);
  });
});
