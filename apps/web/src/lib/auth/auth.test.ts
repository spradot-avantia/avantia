import { describe, expect, it } from "vitest";
import { evaluarContrasena } from "./contrasena";
import { crearLimitador } from "./limite";
import {
  MSG_CREDENCIALES,
  MSG_LIMITE,
  loginSchema,
  mensajeErrorAuth,
  recuperacionSchema,
  restablecerSchema,
  sanitizarNext,
  signupSchema,
} from "./validacion";

describe("evaluarContrasena", () => {
  it("rechaza menos de 10 caracteres y dice cuántos faltan", () => {
    const r = evaluarContrasena("abc12345");
    expect(r.cumple).toBe(false);
    expect(r.ayuda).toContain("2 caracteres");
  });
  it("acepta 10 o más", () => {
    expect(evaluarContrasena("unaclavelarga").cumple).toBe(true);
  });
  it("puntúa más con largo y mezcla, y castiga las comunes", () => {
    expect(evaluarContrasena("Cl4ve-muy-larga-2026").nivel).toBe("fuerte");
    expect(evaluarContrasena("password123").puntaje).toBeLessThanOrEqual(2);
  });
});

describe("esquemas", () => {
  it("login normaliza el correo", () => {
    const r = loginSchema.parse({ email: "  Ana@Correo.COM ", password: "x" });
    expect(r.email).toBe("ana@correo.com");
  });
  it("signup exige términos, largo y correo válido", () => {
    const base = { email: "a@b.cl", password: "una-clave-larga", terminos: true };
    expect(signupSchema.safeParse(base).success).toBe(true);
    expect(signupSchema.safeParse({ ...base, terminos: false }).success).toBe(false);
    expect(signupSchema.safeParse({ ...base, password: "corta" }).success).toBe(false);
    expect(signupSchema.safeParse({ ...base, email: "no-es-correo" }).success).toBe(false);
  });
  it("signup: nombre vacío es opcional", () => {
    const r = signupSchema.parse({ nombre: "  ", email: "a@b.cl", password: "una-clave-larga", terminos: true });
    expect(r.nombre).toBeUndefined();
  });
  it("recuperación valida el correo", () => {
    expect(recuperacionSchema.safeParse({ email: "x" }).success).toBe(false);
  });
  it("restablecer exige confirmación igual", () => {
    expect(restablecerSchema.safeParse({ password: "una-clave-larga", confirmacion: "otra-clave-larga" }).success).toBe(false);
    expect(restablecerSchema.safeParse({ password: "una-clave-larga", confirmacion: "una-clave-larga" }).success).toBe(true);
  });
});

describe("sanitizarNext", () => {
  it("permite rutas internas", () => {
    expect(sanitizarNext("/cursos?x=1")).toBe("/cursos?x=1");
  });
  it.each(["//evil.com", "https://evil.com", "/\\evil.com", "javascript:alert(1)", "", undefined, "/login", "/auth/confirm"])(
    "rechaza %s",
    (v) => {
      expect(sanitizarNext(v)).toBe("/");
    },
  );
});

describe("mensajeErrorAuth", () => {
  it("login: credenciales inválidas no distinguen correo inexistente", () => {
    expect(mensajeErrorAuth({ code: "invalid_credentials", status: 400 }, "login")).toBe(MSG_CREDENCIALES);
  });
  it("traduce límite de tasa", () => {
    expect(mensajeErrorAuth({ status: 429 })).toBe(MSG_LIMITE);
  });
});

describe("crearLimitador", () => {
  it("bloquea tras el máximo y libera al pasar la ventana", () => {
    let t = 0;
    const l = crearLimitador(2, 1000, () => t);
    expect(l.permitir("k")).toBe(true);
    expect(l.permitir("k")).toBe(true);
    expect(l.permitir("k")).toBe(false);
    expect(l.permitir("otra")).toBe(true);
    t = 1500;
    expect(l.permitir("k")).toBe(true);
  });
});
