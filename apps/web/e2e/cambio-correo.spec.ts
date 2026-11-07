import { randomUUID } from "node:crypto";
import { expect, test, type Browser, type TestInfo } from "@playwright/test";
import { hashPassword } from "../src/lib/alumno/password";
import { hashToken } from "../src/lib/alumno/token";
import { nuevaSesion, rest } from "./helpers/datos";

// Cambio de correo del alumno (ADR 036) de punta a punta, con datos reales de Supabase.
// Crea SUS PROPIOS alumnos (correos @e2e.invalid: ningún correo real sale) y los borra al final.
// El enlace del correo no se puede leer, así que la prueba inserta su propio token (con hash
// conocido) para ejercer la confirmación; el paso de «pedir el cambio» sí se hace por la pantalla.
//
// Uso (desde apps/web, con .env.local y la app corriendo, p. ej. `next start -p 3100`):
//   E2E_TENANT=academia-avantia E2E_PORT=3100 npx playwright test cambio-correo --project=escritorio
const SUB = process.env.E2E_TENANT ?? "academia-avantia";
const sufijo = randomUUID().slice(0, 8);
const CLAVE = "Clave-E2E-segura-1";
const D = {
  tenantId: "",
  a: { id: "", correo: `a-${sufijo}@e2e.invalid`, token: "" },
  b: { id: "", correo: `b-${sufijo}@e2e.invalid`, token: "" },
  nuevo: `nuevo-${sufijo}@e2e.invalid`,
};

function escritorio(info: TestInfo) {
  test.skip(info.project.name !== "escritorio", "se prueba solo en escritorio");
}

async function crearAlumno(nombre: string, correo: string) {
  const r = await rest("alumnos", {
    method: "POST",
    body: { tenant_id: D.tenantId, nombre, correo, password_hash: await hashPassword(CLAVE), correo_verificado_at: new Date().toISOString() },
  });
  const id = r.data[0].id as string;
  const s = nuevaSesion();
  await rest("alumno_tokens", {
    method: "POST",
    body: { tenant_id: D.tenantId, alumno_id: id, tipo: "sesion", token_hash: s.hash, expira_at: new Date(Date.now() + 3600_000).toISOString() },
  });
  return { id, token: s.token };
}

async function tokenCambio(alumnoId: string, dato: string, expiraEnMs = 3600_000) {
  const token = randomUUID().replace(/-/g, "") + randomUUID().replace(/-/g, "");
  const r = await rest("alumno_tokens", {
    method: "POST",
    body: {
      tenant_id: D.tenantId,
      alumno_id: alumnoId,
      tipo: "cambio_correo",
      dato,
      token_hash: hashToken(token),
      expira_at: new Date(Date.now() + expiraEnMs).toISOString(),
    },
  });
  expect(r.status, JSON.stringify(r.data)).toBe(201);
  return token;
}

const alumnoDb = async (id: string) =>
  (await rest("alumnos", { query: `tenant_id=eq.${D.tenantId}&id=eq.${id}&select=correo,correo_verificado_at` })).data[0] as {
    correo: string;
    correo_verificado_at: string | null;
  };
const tokensDe = async (id: string, tipo: string) =>
  (await rest("alumno_tokens", { query: `tenant_id=eq.${D.tenantId}&alumno_id=eq.${id}&tipo=eq.${tipo}&select=dato,usado_at` })).data as {
    dato: string | null;
    usado_at: string | null;
  }[];

async function conSesion(browser: Browser, baseURL: string | undefined, token: string) {
  const ctx = await browser.newContext({ baseURL });
  await ctx.addCookies([{ name: "av_alumno", value: token, url: baseURL! }]);
  return ctx;
}

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  const t = await rest("tenants", { query: `slug=eq.${SUB}&select=id` });
  D.tenantId = t.data?.[0]?.id ?? "";
  expect(D.tenantId, `no existe la academia ${SUB}`).toBeTruthy();
  Object.assign(D.a, await crearAlumno(`Alumno A ${sufijo}`, D.a.correo));
  Object.assign(D.b, await crearAlumno(`Alumno B ${sufijo}`, D.b.correo));
});

test.afterAll(async () => {
  if (!D.tenantId) return;
  const ids = [D.a.id, D.b.id].filter(Boolean).join(",");
  if (!ids) return;
  await rest("eventos", { method: "DELETE", query: `tenant_id=eq.${D.tenantId}&alumno_id=in.(${ids})` });
  await rest("alumnos", { method: "DELETE", query: `tenant_id=eq.${D.tenantId}&id=in.(${ids})` });
});

test("sin sesión, /perfil lleva a ingresar", async ({ page }, info) => {
  escritorio(info);
  await page.goto("/perfil");
  await expect(page).toHaveURL(/\/ingresar/);
});

test("pedir el cambio: contraseña incorrecta y correo igual al actual se rechazan", async ({ browser, baseURL }, info) => {
  escritorio(info);
  const ctx = await conSesion(browser, baseURL, D.a.token);
  const page = await ctx.newPage();
  await page.goto("/perfil");
  await page.getByLabel("Correo nuevo").fill(D.nuevo);
  await page.getByLabel("Tu contraseña actual").fill("clave-equivocada-123");
  await page.getByRole("button", { name: "Enviarme el enlace" }).click();
  await expect(page.getByText("Esa no es tu contraseña actual")).toBeVisible();
  expect((await tokensDe(D.a.id, "cambio_correo")).length).toBe(0);

  await page.getByLabel("Correo nuevo").fill(D.a.correo);
  await page.getByLabel("Tu contraseña actual").fill(CLAVE);
  await page.getByRole("button", { name: "Enviarme el enlace" }).click();
  await expect(page.getByText("Ese ya es tu correo actual")).toBeVisible();
  expect((await tokensDe(D.a.id, "cambio_correo")).length).toBe(0);
  await ctx.close();
});

test("pedir el cambio con un correo que ya existe: misma respuesta y no se emite enlace", async ({ browser, baseURL }, info) => {
  escritorio(info);
  const ctx = await conSesion(browser, baseURL, D.a.token);
  const page = await ctx.newPage();
  await page.goto("/perfil");
  await page.getByLabel("Correo nuevo").fill(D.b.correo);
  await page.getByLabel("Tu contraseña actual").fill(CLAVE);
  await page.getByRole("button", { name: "Enviarme el enlace" }).click();
  await expect(page.getByText(`Te enviamos un enlace a ${D.b.correo}`)).toBeVisible();
  expect((await tokensDe(D.a.id, "cambio_correo")).length).toBe(0);
  expect((await alumnoDb(D.a.id)).correo).toBe(D.a.correo);
  await ctx.close();
});

test("pedir el cambio con correo libre: emite el enlace y NO cambia alumnos.correo", async ({ browser, baseURL }, info) => {
  escritorio(info);
  const ctx = await conSesion(browser, baseURL, D.a.token);
  const page = await ctx.newPage();
  await page.goto("/perfil");
  await page.getByLabel("Correo nuevo").fill(D.nuevo.toUpperCase());
  await page.getByLabel("Tu contraseña actual").fill(CLAVE);
  await page.getByRole("button", { name: "Enviarme el enlace" }).click();
  await expect(page.getByText(`Te enviamos un enlace a ${D.nuevo}`)).toBeVisible();
  const t = await tokensDe(D.a.id, "cambio_correo");
  expect(t).toHaveLength(1);
  expect(t[0].dato).toBe(D.nuevo);
  expect((await alumnoDb(D.a.id)).correo).toBe(D.a.correo);
  await ctx.close();
});

test("confirmar con un enlace vencido, inexistente o sin token falla y no cambia nada", async ({ page }, info) => {
  escritorio(info);
  const vencido = await tokenCambio(D.a.id, D.nuevo, -1000);
  await page.goto(`/confirmar-correo?token=${vencido}`);
  await page.getByRole("button", { name: "Confirmar mi nuevo correo" }).click();
  await expect(page.getByText("venció o ya se usó")).toBeVisible();

  await page.goto("/confirmar-correo?token=no-existe");
  await page.getByRole("button", { name: "Confirmar mi nuevo correo" }).click();
  await expect(page.getByText("venció o ya se usó")).toBeVisible();

  await page.goto("/confirmar-correo");
  await expect(page.getByText("El enlace no es válido")).toBeVisible();
  expect((await alumnoDb(D.a.id)).correo).toBe(D.a.correo);
});

test("confirmar cuando el correo ya lo ocupa otra cuenta: error y el correo no cambia", async ({ page }, info) => {
  escritorio(info);
  const token = await tokenCambio(D.a.id, D.b.correo);
  await page.goto(`/confirmar-correo?token=${token}`);
  await page.getByRole("button", { name: "Confirmar mi nuevo correo" }).click();
  await expect(page.getByText("Ese correo ya está en uso")).toBeVisible();
  expect((await alumnoDb(D.a.id)).correo).toBe(D.a.correo);
  expect((await alumnoDb(D.b.id)).correo).toBe(D.b.correo);
});

test("confirmar: cambia el correo, cierra las otras sesiones, deja sesión nueva y el enlace es de un solo uso", async ({
  browser,
  baseURL,
  page,
}, info) => {
  escritorio(info);
  const token = await tokenCambio(D.a.id, D.nuevo);
  await page.goto(`/confirmar-correo?token=${token}`);
  await page.getByRole("button", { name: "Confirmar mi nuevo correo" }).click();
  await expect(page).toHaveURL(/\/perfil$/);
  await expect(page.getByText(D.nuevo).first()).toBeVisible();

  const a = await alumnoDb(D.a.id);
  expect(a.correo).toBe(D.nuevo);
  expect(a.correo_verificado_at).not.toBeNull();

  // La sesión anterior (otro dispositivo) quedó cerrada.
  const vieja = await conSesion(browser, baseURL, D.a.token);
  const p2 = await vieja.newPage();
  await p2.goto("/perfil");
  await expect(p2).toHaveURL(/\/ingresar/);
  await vieja.close();

  const ev = await rest("eventos", { query: `tenant_id=eq.${D.tenantId}&alumno_id=eq.${D.a.id}&tipo=eq.correo_cambiado&select=id` });
  expect(ev.data).toHaveLength(1);

  // Un solo uso.
  await page.goto(`/confirmar-correo?token=${token}`);
  await page.getByRole("button", { name: "Confirmar mi nuevo correo" }).click();
  await expect(page.getByText("venció o ya se usó")).toBeVisible();
});

test("tras el cambio se ingresa con el correo nuevo y el anterior ya no entra", async ({ page }, info) => {
  escritorio(info);
  await page.context().clearCookies();
  await page.goto("/ingresar");
  await page.getByLabel("Correo").fill(D.a.correo);
  await page.getByLabel("Contraseña").fill(CLAVE);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page).toHaveURL(/\/ingresar/);

  await page.getByLabel("Correo").fill(D.nuevo);
  await page.getByLabel("Contraseña").fill(CLAVE);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/mis-cursos/, { timeout: 15_000 });
});
