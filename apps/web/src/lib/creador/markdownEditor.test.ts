import { describe, expect, it } from "vitest";
import { accionDeAtajo, aplicarAccion } from "./markdownEditor";
import { parsearMarkdown } from "./markdown";

const ap = (t: string, a: number, b: number, acc: Parameters<typeof aplicarAccion>[3]) => aplicarAccion(t, a, b, acc);
const sel = (r: { texto: string; ini: number; fin: number }) => r.texto.slice(r.ini, r.fin);

describe("barra del editor de texto (ADR 035)", () => {
  it("envuelve la selección y deja el texto seleccionado", () => {
    const r = ap("hola mundo", 5, 10, "negrita");
    expect(r.texto).toBe("hola **mundo**");
    expect(sel(r)).toBe("mundo");
  });

  it("sin selección inserta un ejemplo seleccionado", () => {
    const r = ap("", 0, 0, "cursiva");
    expect(r.texto).toBe("*texto en cursiva*");
    expect(sel(r)).toBe("texto en cursiva");
  });

  it("repetir la acción quita el formato", () => {
    const una = ap("hola mundo", 5, 10, "resaltado");
    expect(ap(una.texto, una.ini, una.fin, "resaltado").texto).toBe("hola mundo");
  });

  it("enlace: con texto elegido selecciona la dirección; sin texto, la etiqueta", () => {
    const a = ap("ver docs", 4, 8, "enlace");
    expect(a.texto).toBe("ver [docs](https://)");
    expect(sel(a)).toBe("https://");
    expect(sel(ap("", 0, 0, "enlace"))).toBe("texto del enlace");
  });

  it("prefijos por línea: aplica a todas las líneas y alterna", () => {
    const t = "uno\ndos\ntres";
    const r = ap(t, 0, t.length, "lista");
    expect(r.texto).toBe("- uno\n- dos\n- tres");
    expect(ap(r.texto, r.ini, r.fin, "lista").texto).toBe(t);
  });

  it("lista numerada y título sustituyen al formato anterior", () => {
    expect(ap("a\nb", 0, 3, "numerada").texto).toBe("1. a\n2. b");
    expect(ap("## algo", 0, 0, "titulo").texto).toBe("# algo");
  });

  it("un aviso sobre una selección la cita línea a línea", () => {
    const r = ap("antes\n\nmensaje\notra", 7, 19, "advertencia");
    expect(r.texto).toBe("antes\n\n> [!advertencia] Título\n> mensaje\n> otra\n");
    expect(sel(r)).toBe("Título");
  });

  it("los bloques se separan con líneas en blanco del texto vecino", () => {
    const r = ap("hola\nchao", 5, 5, "tabla");
    expect(r.texto.startsWith("hola\n\n| Columna 1")).toBe(true);
    expect(r.texto.endsWith("Dato |\n\nchao")).toBe(true);
    expect(sel(r)).toBe("Columna 1");
  });

  it("con el cursor a mitad de una línea, el bloque va después de ella sin partirla", () => {
    const r = ap("una línea larga\nsigue", 4, 4, "separador");
    expect(r.texto).toBe("una línea larga\n\n---\n\nsigue");
  });

  it("todo lo que inserta se interpreta como el bloque esperado", () => {
    const esperado = {
      tabla: "tabla",
      pestanas: "pestanas",
      tarjetas: "tarjetas",
      desplegable: "desplegable",
      separador: "separador",
      nota: "aviso",
      consejo: "aviso",
      importante: "aviso",
      advertencia: "aviso",
      "bloque-codigo": "codigo",
      cita: "cita",
      tareas: "lista",
    } as const;
    for (const [acc, tipo] of Object.entries(esperado)) {
      const r = ap("", 0, 0, acc as keyof typeof esperado);
      expect(parsearMarkdown(r.texto).map((b) => b.t), acc).toContain(tipo);
    }
  });

  it("atajos de teclado", () => {
    const k = (key: string, extra = {}) => accionDeAtajo({ key, ctrlKey: true, metaKey: false, shiftKey: false, altKey: false, ...extra });
    expect([k("b"), k("I"), k("k"), k("z")]).toEqual(["negrita", "cursiva", "enlace", null]);
    expect(k("b", { shiftKey: true })).toBeNull();
    expect(accionDeAtajo({ key: "b", ctrlKey: false, metaKey: false, shiftKey: false, altKey: false })).toBeNull();
  });
});
