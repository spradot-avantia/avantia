import { describe, expect, it } from "vitest";
import { indiceDeTitulos, parsearInline, parsearMarkdown, textoPlano } from "./markdown";

describe("markdown mínimo", () => {
  it("títulos, listas y párrafos", () => {
    const b = parsearMarkdown("# Hola\n\nUn párrafo\ncontinúa.\n\n- uno\n- dos\n\n1. a\n2. b");
    expect(b.map((x) => x.t)).toEqual(["titulo", "parrafo", "lista", "lista"]);
    expect(b[2]).toMatchObject({ ordenada: false });
    expect(b[3]).toMatchObject({ ordenada: true });
  });
  it("negrita, cursiva y enlaces https", () => {
    const i = parsearInline("a **b** *c* [d](https://x.cl/y)");
    expect(i.map((x) => x.t)).toEqual(["texto", "negrita", "texto", "cursiva", "texto", "enlace"]);
  });
  it("descarta enlaces no https (queda como texto)", () => {
    for (const malo of ["[x](javascript:alert(1))", "[x](http://a.cl)", "[x](data:text/html,hola)"]) {
      expect(parsearInline(malo).some((n) => n.t === "enlace")).toBe(false);
    }
  });
  it("no interpreta HTML: queda como texto literal", () => {
    const b = parsearMarkdown('<img src=x onerror="alert(1)"> <script>x</script>');
    expect(b).toHaveLength(1);
    expect(JSON.stringify(b)).toContain("<script>");
    expect(b[0].t).toBe("parrafo");
  });
});

describe("índice de títulos (ADR 033)", () => {
  const indice = (t: string) => indiceDeTitulos(parsearMarkdown(t));

  it("lista los títulos en orden con su nivel de página (# → h2, ## → h3, ### → h4)", () => {
    const i = indice("# Uno\n\ntexto\n\n## Dos\n\n### Tres");
    expect(i.map((e) => [e.nivel, e.texto])).toEqual([
      [2, "Uno"],
      [3, "Dos"],
      [4, "Tres"],
    ]);
  });

  it("el id sale del texto: sin tildes, en minúsculas y con prefijo", () => {
    expect(indice("# ¿Qué es la Inteligencia Artificial?")[0].id).toBe("sec-que-es-la-inteligencia-artificial");
  });

  it("los títulos repetidos reciben ids únicos", () => {
    expect(indice("# Repaso\n\n# Repaso\n\n# Repaso").map((e) => e.id)).toEqual(["sec-repaso", "sec-repaso-2", "sec-repaso-3"]);
  });

  it("un título sin letras ni números usa un id de respaldo y sigue siendo único", () => {
    expect(indice("# ???\n\n# !!!").map((e) => e.id)).toEqual(["sec-seccion", "sec-seccion-2"]);
  });

  it("ignora negrita, cursiva y enlaces en el texto del índice", () => {
    const i = indice("# Usa **negrita**, *cursiva* y [un enlace](https://x.cl)");
    expect(i[0].texto).toBe("Usa negrita, cursiva y un enlace");
  });

  it("sin títulos, el índice queda vacío", () => {
    expect(indice("solo un párrafo\n\n- y una lista")).toEqual([]);
  });

  it("textoPlano concatena los nodos", () => {
    expect(textoPlano(parsearInline("a **b** c"))).toBe("a b c");
  });
});
