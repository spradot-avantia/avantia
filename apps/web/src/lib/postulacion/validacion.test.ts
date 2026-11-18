import { describe, expect, it } from "vitest";
import { armarDescripcion, postulacionSchema } from "./validacion";

const ok = { nombre: " Ana ", email: " ANA@Correo.com ", ensena: "Fotografía de producto", publico: "Emprendedores" };

describe("postulacionSchema", () => {
  it("normaliza nombre y correo", () => {
    const r = postulacionSchema.parse(ok);
    expect(r.nombre).toBe("Ana");
    expect(r.email).toBe("ana@correo.com");
  });
  it("rechaza correo inválido, nombre vacío y respuestas vacías o muy largas", () => {
    expect(postulacionSchema.safeParse({ ...ok, email: "ana@" }).success).toBe(false);
    expect(postulacionSchema.safeParse({ ...ok, nombre: "  " }).success).toBe(false);
    expect(postulacionSchema.safeParse({ ...ok, ensena: "   " }).success).toBe(false);
    expect(postulacionSchema.safeParse({ ...ok, publico: "" }).success).toBe(false);
    expect(postulacionSchema.safeParse({ ...ok, ensena: "x".repeat(281) }).success).toBe(false);
  });
  it("acepta una sola palabra en cada respuesta", () => {
    expect(postulacionSchema.safeParse({ ...ok, ensena: "Minería", publico: "Estudiantes" }).success).toBe(true);
  });
  it("junta las dos respuestas en una descripción", () => {
    expect(armarDescripcion(" Minería ", "Estudiantes ")).toBe("Qué enseña: Minería · A quién: Estudiantes");
  });
});