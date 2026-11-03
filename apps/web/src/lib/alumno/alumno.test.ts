import { describe, expect, it } from "vitest";
import { fechaLiberacion, hoyEnZona, leccionLiberada } from "./liberacion";
import { hashPassword, verifyPassword } from "./password";
import { hashToken, nuevoToken } from "./token";
import { limpiarCampana, registroSchema, restablecerSchema, sanitizarNextAlumno } from "./validacion";
import { calcularXp, nivelDe, porcentaje } from "./xp";

describe("password (scrypt)", () => {
  it("verifica la correcta y rechaza otra", async () => {
    const h = await hashPassword("una contraseña larga 123");
    expect(h.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("una contraseña larga 123", h)).toBe(true);
    expect(await verifyPassword("otra contraseña larga", h)).toBe(false);
  });
  it("usa sal distinta por hash", async () => {
    expect(await hashPassword("misma-clave-123")).not.toBe(await hashPassword("misma-clave-123"));
  });
  it("rechaza hashes mal formados sin lanzar", async () => {
    expect(await verifyPassword("x", "")).toBe(false);
    expect(await verifyPassword("x", "bcrypt$1$2")).toBe(false);
    expect(await verifyPassword("x", "scrypt$a$b$c$d$e")).toBe(false);
  });
});

describe("token", () => {
  it("el hash es estable y distinto del token", () => {
    const { token, hash } = nuevoToken();
    expect(hash).toBe(hashToken(token));
    expect(hash).not.toBe(token);
    expect(nuevoToken().token).not.toBe(token);
  });
});

const curso = {
  modulos: [
    { lecciones: [{ id: "a" }, { id: "b" }] },
    { lecciones: [{ id: "c" }] },
  ],
};

describe("xp", () => {
  it("sin avance = 0", () => {
    expect(calcularXp(curso, new Set()).xp).toBe(0);
  });
  it("10 por lección", () => {
    const d = calcularXp(curso, new Set(["a"]));
    expect(d.xp).toBe(10);
    expect(d.modulosCompletos).toBe(0);
  });
  it("suma 20 al completar un módulo", () => {
    const d = calcularXp(curso, new Set(["a", "b"]));
    expect(d.xp).toBe(20 + 20);
    expect(d.modulosCompletos).toBe(1);
    expect(d.cursoCompleto).toBe(false);
  });
  it("suma 50 al completar el curso", () => {
    const d = calcularXp(curso, new Set(["a", "b", "c"]));
    expect(d.xp).toBe(30 + 40 + 50);
    expect(d.cursoCompleto).toBe(true);
  });
  it("un curso vacío nunca está completo", () => {
    expect(calcularXp({ modulos: [] }, new Set()).cursoCompleto).toBe(false);
    expect(calcularXp({ modulos: [{ lecciones: [] }] }, new Set()).cursoCompleto).toBe(false);
  });
  it("ignora lecciones que no son del curso", () => {
    expect(calcularXp(curso, new Set(["zzz"])).xp).toBe(0);
  });
});

describe("niveles", () => {
  it("umbrales 0/100/250/450/700", () => {
    expect(nivelDe(0).nivel).toBe(1);
    expect(nivelDe(99).nivel).toBe(1);
    expect(nivelDe(100).nivel).toBe(2);
    expect(nivelDe(250).nivel).toBe(3);
    expect(nivelDe(450).nivel).toBe(4);
    expect(nivelDe(700).nivel).toBe(5);
    expect(nivelDe(5000).nivel).toBe(5);
  });
  it("informa lo que falta y el porcentaje dentro del nivel", () => {
    expect(nivelDe(50)).toMatchObject({ nivel: 1, faltan: 50, pct: 50, siguiente: 2 });
    expect(nivelDe(700)).toMatchObject({ faltan: null, pct: 100, siguiente: null });
  });
  it("porcentaje", () => {
    expect(porcentaje(1, 3)).toBe(33);
    expect(porcentaje(0, 0)).toBe(0);
  });
});

describe("liberación por fecha (ADR 004)", () => {
  const cohorte = { modalidad: "con_fechas" as const, fechaInicio: "2026-11-10" };
  it("a su ritmo: todo disponible", () => {
    expect(leccionLiberada({ modalidad: "a_su_ritmo", fechaInicio: null }, 5, "2026-01-01")).toBe(true);
  });
  it("con fechas: nada antes del inicio", () => {
    expect(leccionLiberada(cohorte, null, "2026-11-09")).toBe(false);
    expect(leccionLiberada(cohorte, null, "2026-11-10")).toBe(true);
  });
  it("con fechas: dia_liberacion se suma al inicio", () => {
    expect(fechaLiberacion(cohorte, 7)).toBe("2026-11-17");
    expect(leccionLiberada(cohorte, 7, "2026-11-16")).toBe(false);
    expect(leccionLiberada(cohorte, 7, "2026-11-17")).toBe(true);
  });
  it("hoyEnZona entrega YYYY-MM-DD en la zona pedida", () => {
    expect(hoyEnZona(new Date("2026-11-04T02:30:00Z"), "America/Santiago")).toBe("2026-11-03");
  });
});

describe("validación del alumno", () => {
  it("registro exige términos y contraseña de 10+", () => {
    const base = { nombre: "Camila Rojas", email: "Camila@Mail.cl", password: "una-clave-larga", terminos: true };
    const ok = registroSchema.safeParse(base);
    expect(ok.success).toBe(true);
    if (ok.success) expect(ok.data.email).toBe("camila@mail.cl");
    expect(registroSchema.safeParse({ ...base, terminos: false }).success).toBe(false);
    expect(registroSchema.safeParse({ ...base, password: "corta" }).success).toBe(false);
    expect(registroSchema.safeParse({ ...base, email: "no-es-correo" }).success).toBe(false);
  });
  it("restablecer exige coincidencia", () => {
    expect(restablecerSchema.safeParse({ password: "una-clave-larga", confirmacion: "otra-clave-larga" }).success).toBe(false);
    expect(restablecerSchema.safeParse({ password: "una-clave-larga", confirmacion: "una-clave-larga" }).success).toBe(true);
  });
  it("next solo admite rutas internas", () => {
    expect(sanitizarNextAlumno("/progreso")).toBe("/progreso");
    expect(sanitizarNextAlumno("//evil.com")).toBe("/mis-cursos");
    expect(sanitizarNextAlumno("https://evil.com")).toBe("/mis-cursos");
    expect(sanitizarNextAlumno("/\\evil.com")).toBe("/mis-cursos");
    expect(sanitizarNextAlumno("/ingresar")).toBe("/mis-cursos");
    expect(sanitizarNextAlumno(undefined)).toBe("/mis-cursos");
  });
  it("campaña acotada", () => {
    expect(limpiarCampana("fb / lanzamiento")).toBe("fb / lanzamiento");
    expect(limpiarCampana("<script>")).toBeNull();
    expect(limpiarCampana("a".repeat(500))?.length).toBe(120);
  });
});
