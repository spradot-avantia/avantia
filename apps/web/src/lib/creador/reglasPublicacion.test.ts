import { describe, expect, it } from "vitest";
import { leccionLista } from "./reglasPublicacion";

const base = { titulo: "Lección", contenidoUrl: null, contenidoTexto: null };

describe("leccionLista (ADR 030: documento con archivo propio)", () => {
  it("un documento con archivo subido está listo, sin enlace", () => {
    expect(leccionLista({ ...base, tipo: "documento", archivoNombre: "Guía.pdf" })).toBe(true);
  });
  it("un documento sin enlace ni archivo no está listo", () => {
    expect(leccionLista({ ...base, tipo: "documento", archivoNombre: null })).toBe(false);
    expect(leccionLista({ ...base, tipo: "documento" })).toBe(false);
  });
  it("un documento con enlace https válido sigue estando listo", () => {
    expect(leccionLista({ ...base, tipo: "documento", contenidoUrl: "https://ejemplo.cl/guia", archivoNombre: null })).toBe(true);
    expect(leccionLista({ ...base, tipo: "documento", contenidoUrl: "http://inseguro.cl", archivoNombre: null })).toBe(false);
  });
  it("el archivo no vale para un video: exige su enlace", () => {
    expect(leccionLista({ ...base, tipo: "video", archivoNombre: "Guía.pdf" })).toBe(false);
  });
  it("sin título nunca está lista, aunque tenga archivo", () => {
    expect(leccionLista({ ...base, titulo: "  ", tipo: "documento", archivoNombre: "Guía.pdf" })).toBe(false);
  });
  it("las lecciones de texto no cambian", () => {
    expect(leccionLista({ ...base, tipo: "texto", contenidoTexto: "Hola" })).toBe(true);
    expect(leccionLista({ ...base, tipo: "texto", contenidoTexto: "  " })).toBe(false);
  });
});
