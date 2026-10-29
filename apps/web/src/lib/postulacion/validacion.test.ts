import { describe, expect, it } from "vitest";
import { postulacionSchema } from "./validacion";

const ok = { nombre: " Ana ", email: " ANA@Correo.com ", descripcion: "Enseño fotografía de producto a emprendedores." };

describe("postulacionSchema", () => {
  it("normaliza nombre y correo", () => {
    const r = postulacionSchema.parse(ok);
    expect(r.nombre).toBe("Ana");
    expect(r.email).toBe("ana@correo.com");
  });
  it("rechaza correo inválido, nombre vacío y texto muy corto o largo", () => {
    expect(postulacionSchema.safeParse({ ...ok, email: "ana@" }).success).toBe(false);
    expect(postulacionSchema.safeParse({ ...ok, nombre: "  " }).success).toBe(false);
    expect(postulacionSchema.safeParse({ ...ok, descripcion: "hola" }).success).toBe(false);
    expect(postulacionSchema.safeParse({ ...ok, descripcion: "x".repeat(601) }).success).toBe(false);
  });
});
