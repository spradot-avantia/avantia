import { describe, expect, it } from "vitest";
import { parsearInline, parsearMarkdown } from "./markdown";

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
