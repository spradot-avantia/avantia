import { describe, expect, it } from "vitest";
import {
  ARCHIVO_MAX_BYTES,
  CUOTA_ACADEMIA_BYTES,
  RUTA_OBJETO,
  cabeEnCuota,
  extensionDe,
  formatearBytes,
  nombreVisible,
  validarArchivo,
} from "./archivosReglas";

describe("validarArchivo", () => {
  it("acepta tipos permitidos por extensión, sin importar mayúsculas", () => {
    const r = validarArchivo("Guía.PDF", 1000);
    expect(r).toEqual({ ok: true, ext: "pdf", mime: "application/pdf" });
  });
  it("rechaza ejecutables, html y svg", () => {
    for (const n of ["a.exe", "a.html", "a.svg", "a.js", "sin-extension"]) expect(validarArchivo(n, 10).ok).toBe(false);
  });
  it("rechaza vacío y sobre el tope por archivo", () => {
    expect(validarArchivo("a.pdf", 0).ok).toBe(false);
    expect(validarArchivo("a.pdf", ARCHIVO_MAX_BYTES).ok).toBe(true);
    expect(validarArchivo("a.pdf", ARCHIVO_MAX_BYTES + 1).ok).toBe(false);
  });
});

describe("cabeEnCuota", () => {
  it("permite hasta el tope exacto y rechaza el exceso", () => {
    expect(cabeEnCuota(CUOTA_ACADEMIA_BYTES - 10, 10).ok).toBe(true);
    expect(cabeEnCuota(CUOTA_ACADEMIA_BYTES - 10, 11).ok).toBe(false);
  });
});

describe("utilidades", () => {
  it("extensionDe y formatearBytes", () => {
    expect(extensionDe("a.b.PNG")).toBe("png");
    expect(extensionDe("sin")).toBe("");
    expect(formatearBytes(500)).toBe("500 B");
    expect(formatearBytes(2048)).toBe("2 KB");
    expect(formatearBytes(1.5 * 1024 * 1024)).toBe("1,5 MB");
    expect(formatearBytes(25 * 1024 * 1024)).toBe("25 MB");
  });
  it("nombreVisible quita rutas y controles", () => {
    expect(nombreVisible("C:\\x\\y\\informe.pdf")).toBe("informe.pdf");
    expect(nombreVisible("../../etc/passwd")).toBe("passwd");
    expect(nombreVisible("")).toBe("archivo");
  });
  it("RUTA_OBJETO exige tenant/curso/uuid.ext", () => {
    const u = "123e4567-e89b-12d3-a456-426614174000";
    expect(RUTA_OBJETO.test(`${u}/${u}/${u}.pdf`)).toBe(true);
    expect(RUTA_OBJETO.test(`${u}/../${u}.pdf`)).toBe(false);
    expect(RUTA_OBJETO.test(`${u}/${u}/${u}.pdf/x`)).toBe(false);
  });
});
