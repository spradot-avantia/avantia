import { describe, expect, it } from "vitest";
import { classifyHost } from "./host";
import { validarSubdominio } from "./reservados";

const cfg = { panelHost: "app.avantia.app", marketingHosts: ["avantia.app", "www.avantia.app"] };

describe("classifyHost", () => {
  it("panel exacto y localhost", () => {
    expect(classifyHost("app.avantia.app", cfg)).toBe("panel");
    expect(classifyHost("localhost:3000", cfg)).toBe("panel");
  });
  it("myapp.avantia.app es una academia, no el panel", () => {
    expect(classifyHost("myapp.avantia.app", cfg)).toBe("tenant");
    expect(classifyHost("miapp.avantia.app", cfg)).toBe("tenant");
  });
  it("marketing, dominio propio y host desconocido", () => {
    expect(classifyHost("avantia.app", cfg)).toBe("marketing");
    expect(classifyHost("www.avantia.app", cfg)).toBe("marketing");
    expect(classifyHost("academiadejuan.com", cfg)).toBe("tenant");
    expect(classifyHost("", cfg)).toBe("tenant");
  });
  it("ignora mayúsculas", () => {
    expect(classifyHost("APP.avantia.app", cfg)).toBe("panel");
  });
});

describe("classifyHost: host único", () => {
  const unico = { ...cfg, platformHosts: ["goavantia.com", "www.goavantia.com"] };
  it("sirve landing y panel en el mismo host", () => {
    expect(classifyHost("goavantia.com", unico)).toBe("plataforma");
    expect(classifyHost("www.goavantia.com", unico)).toBe("plataforma");
  });
  it("una academia bajo el dominio sigue siendo tenant", () => {
    expect(classifyHost("miacademia.goavantia.com", unico)).toBe("tenant");
  });
});

describe("validarSubdominio", () => {
  it("acepta nombres válidos, incluido 'myapp'", () => {
    expect(validarSubdominio("myapp").ok).toBe(true);
    expect(validarSubdominio("academia-de-juan").ok).toBe(true);
  });
  it("rechaza reservados y formatos inválidos", () => {
    for (const s of ["app", "www", "admin", "ab", "-juan", "juan-", "Jua n", "a".repeat(41)]) {
      expect(validarSubdominio(s).ok).toBe(false);
    }
  });
});
