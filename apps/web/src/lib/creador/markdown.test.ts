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

describe("markdown ampliado (ADR 035)", () => {
  const tipos = (t: string) => parsearMarkdown(t).map((b) => b.t);

  it("inline: código, tachado y resaltado; el código no interpreta formato", () => {
    const i = parsearInline("usa `**no negrita**`, ~~viejo~~ y ==clave==");
    expect(i.map((x) => x.t)).toEqual(["texto", "codigo", "texto", "tachado", "texto", "resaltado"]);
    expect(i[1]).toEqual({ t: "codigo", v: "**no negrita**" });
    expect(textoPlano(i)).toBe("usa **no negrita**, viejo y clave");
  });

  it("tabla con alineación, relleno de celdas faltantes y barra escapada", () => {
    const b = parsearMarkdown("| A | B | C |\n|:--|:-:|--:|\n| 1 | 2 |\n| x \\| y | **z** | 3 |\n\nsigue");
    expect(b.map((x) => x.t)).toEqual(["tabla", "parrafo"]);
    const t = b[0];
    if (t.t !== "tabla") throw new Error("no es tabla");
    expect(t.alinear).toEqual(["izq", "centro", "der"]);
    expect(t.cabecera).toHaveLength(3);
    expect(t.filas).toHaveLength(2);
    expect(t.filas[0][2]).toEqual([]); // celda faltante, vacía
    expect(textoPlano(t.filas[1][0])).toBe("x | y");
  });

  it("una línea con barras sin fila de guiones no es tabla", () => {
    expect(tipos("a | b\nc | d")).toEqual(["parrafo"]);
  });

  it("las tablas se limitan en columnas y filas", () => {
    const ancho = Array.from({ length: 12 }, (_, i) => `c${i}`);
    const filas = Array.from({ length: 300 }, () => `| ${ancho.join(" | ")} |`).join("\n");
    const t = parsearMarkdown(`| ${ancho.join(" | ")} |\n|${ancho.map(() => "---").join("|")}|\n${filas}`)[0];
    if (t.t !== "tabla") throw new Error("no es tabla");
    expect(t.cabecera).toHaveLength(8);
    expect(t.filas).toHaveLength(200);
    expect(t.filas[0]).toHaveLength(8);
  });

  it("avisos estilo Obsidian, con alias en inglés y título propio", () => {
    const b = parsearMarkdown("> [!tip] Atajo\n> Cuerpo **fuerte**\n\n> [!warning]\n> Cuidado\n\n> [!otra] cosa\n> es una cita");
    expect(b.map((x) => x.t)).toEqual(["aviso", "aviso", "cita"]);
    expect(b[0]).toMatchObject({ tipo: "consejo", titulo: "Atajo" });
    expect(b[1]).toMatchObject({ tipo: "advertencia", titulo: "Advertencia" });
  });

  it("bloques de código conservan el texto sin interpretarlo", () => {
    const b = parsearMarkdown("```sql\nSELECT *\n  FROM t; -- **x** # no es título\n```\n\ndespués");
    expect(b.map((x) => x.t)).toEqual(["codigo", "parrafo"]);
    expect(b[0]).toEqual({ t: "codigo", lenguaje: "sql", v: "SELECT *\n  FROM t; -- **x** # no es título" });
  });

  it("un bloque de código sin cerrar llega hasta el final", () => {
    expect(parsearMarkdown("```\na\nb")).toEqual([{ t: "codigo", lenguaje: "", v: "a\nb" }]);
  });

  it("listas de tareas y separadores", () => {
    const b = parsearMarkdown("- [ ] uno\n- [x] dos\n- tres\n\n---\n\ntexto");
    expect(b.map((x) => x.t)).toEqual(["lista", "separador", "parrafo"]);
    expect(b[0]).toMatchObject({ tareas: [false, true, null] });
    expect(parsearMarkdown("- a\n- b")[0]).not.toHaveProperty("tareas");
  });

  it("pestañas y tarjetas: cada «=== Título» abre un elemento con su propio contenido", () => {
    const b = parsearMarkdown(":::pestanas\n=== Excel\nPasos en **Excel**\n=== Python\n- uno\n- dos\n:::\n\n:::tarjetas\n=== A\nx\n=== B\ny\n:::");
    expect(b.map((x) => x.t)).toEqual(["pestanas", "tarjetas"]);
    const p = b[0];
    if (p.t !== "pestanas") throw new Error("no son pestañas");
    expect(p.items.map((e) => e.titulo)).toEqual(["Excel", "Python"]);
    expect(p.items[1].v[0].t).toBe("lista");
  });

  it("un contenedor sin elementos se muestra como texto normal", () => {
    expect(tipos(":::pestanas\nsolo texto\n:::")).toEqual(["parrafo"]);
  });

  it("desplegable con y sin título; un contenedor sin cerrar llega hasta el final", () => {
    const b = parsearMarkdown(":::desplegable ¿Y si falla?\nRevisa el log.\n:::\n\n:::desplegable\nsin cerrar");
    expect(b).toHaveLength(2);
    expect(b[0]).toMatchObject({ t: "desplegable", titulo: "¿Y si falla?" });
    expect(b[1]).toMatchObject({ t: "desplegable", titulo: "Ver más" });
  });

  it("un «===» dentro de un contenedor anidado no parte el externo", () => {
    const b = parsearMarkdown(":::pestanas\n=== Uno\n:::tarjetas\n=== X\nx\n:::\n=== Dos\ny\n:::");
    const p = b[0];
    if (p.t !== "pestanas") throw new Error("no son pestañas");
    expect(p.items.map((e) => e.titulo)).toEqual(["Uno", "Dos"]);
    expect(p.items[0].v[0].t).toBe("tarjetas");
  });

  it("limita la profundidad y la cantidad de elementos", () => {
    const hondo = ":::desplegable a\n:::desplegable b\n:::desplegable c\n:::desplegable d\nfondo\n:::\n:::\n:::\n:::";
    const aplanar = (bs: ReturnType<typeof parsearMarkdown>, n = 0): number =>
      Math.max(n, ...bs.map((b) => (b.t === "desplegable" ? aplanar(b.v, n + 1) : n)));
    expect(aplanar(parsearMarkdown(hondo))).toBe(3);
    const muchos = ":::tarjetas\n" + Array.from({ length: 20 }, (_, i) => `=== T${i}\nx`).join("\n") + "\n:::";
    const t = parsearMarkdown(muchos)[0];
    if (t.t !== "tarjetas") throw new Error("no son tarjetas");
    expect(t.items).toHaveLength(8);
  });

  it("el HTML y los enlaces peligrosos siguen sin interpretarse dentro de los bloques nuevos", () => {
    const b = parsearMarkdown("> [!nota] <script>x</script>\n> [a](javascript:alert(1))\n\n| <img onerror=x> | b |\n|---|---|\n| [c](http://x.cl) | d |");
    expect(JSON.stringify(b)).not.toContain('"enlace"');
    expect(b.map((x) => x.t)).toEqual(["aviso", "tabla"]);
  });

  it("el índice solo cuenta los títulos del nivel superior", () => {
    const b = parsearMarkdown("# Uno\n\n:::pestanas\n=== A\n## Interno\n:::\n\n> [!nota]\n> # Otro");
    expect(indiceDeTitulos(b).map((e) => e.texto)).toEqual(["Uno"]);
  });
});
