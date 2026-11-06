import { randomUUID } from "node:crypto";
import { expect, test, type TestInfo } from "@playwright/test";
import { E, KEY, URL_DB, nuevaSesion, rest } from "./helpers/datos";

// Flujo curso → módulo → lección (ADR 032) de punta a punta, con datos reales de Supabase.
// Crea SU PROPIO curso, alumno y progreso con un sufijo aleatorio y los borra al final.
//   1. Alumno (cualquier despliegue): primera entrada por la pantalla del módulo, "Continuar" con
//      avance, paso al módulo siguiente, módulo ajeno 404 y sin desborde horizontal en móvil.
//   2. Creador (solo local, en modo demo): esquema del curso (renombrar, agregar, editar lección).
//
// Uso (desde apps/web, con .env.local y `npm run dev` en otra terminal):
//   npx playwright test esquema-modulos --project=escritorio
//   npx playwright test esquema-modulos --project=movil-360 --project=movil-390

const SUB = process.env.E2E_TENANT ?? "prueba";
const PUERTO = process.env.E2E_PORT ?? "3000";
const PANEL = process.env.E2E_PANEL_URL ?? `http://localhost:${PUERTO}`;
const CREADOR_LOCAL = PANEL.startsWith("http://localhost") && E.ALLOW_DEMO_TENANT === "true" && E.DEMO_TENANT_SLUG === SUB;

const sufijo = randomUUID().slice(0, 8);
const D = { tenantId: "", curso: "", m1: "", m2: "", l1: "", l2: "", l3: "", alumno: { id: "", token: "" } };

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  test.skip(!URL_DB || !KEY, "faltan credenciales de Supabase");
  const t = await rest("tenants", { query: `select=id&subdomain=eq.${SUB}` });
  D.tenantId = t.data?.[0]?.id;
  test.skip(!D.tenantId, `no existe la academia ${SUB}`);

  const c = await rest("cursos", {
    method: "POST",
    body: { tenant_id: D.tenantId, slug: `e2e-esq-${sufijo}`, titulo: `Curso E2E esquema ${sufijo}`, descripcion: "Curso de prueba automática del flujo curso, módulo y lección.", estado: "publicado", acceso: "enlace", published_at: new Date().toISOString() },
  });
  D.curso = c.data[0].id;
  const mods = await rest("modulos", {
    method: "POST",
    body: [
      { tenant_id: D.tenantId, curso_id: D.curso, titulo: "Módulo 1: Primeros pasos", orden: 0, descripcion: "Presentación del primer módulo de prueba.", objetivos: ["Entender A", "Aplicar B"], duracion_min: 15 },
      { tenant_id: D.tenantId, curso_id: D.curso, titulo: "Módulo 2: Seguir avanzando", orden: 1, descripcion: "Presentación del segundo módulo.", objetivos: [], duracion_min: null },
    ],
  });
  [D.m1, D.m2] = mods.data.map((m: { id: string }) => m.id);
  const lecs = await rest("lecciones", {
    method: "POST",
    body: [
      { modulo_id: D.m1, titulo: "Lección 1.1", orden: 1, duracion_min: 5 },
      { modulo_id: D.m1, titulo: "Lección 1.2", orden: 2, duracion_min: 7 },
      { modulo_id: D.m2, titulo: "Lección 2.1", orden: 1, duracion_min: null },
    ].map((l) => ({ tenant_id: D.tenantId, curso_id: D.curso, tipo: "texto", contenido_texto: `Contenido de ${l.titulo}`, ...l })),
  });
  [D.l1, D.l2, D.l3] = lecs.data.map((l: { id: string }) => l.id);

  const a = await rest("alumnos", {
    method: "POST",
    body: { tenant_id: D.tenantId, nombre: "Alumno esquema E2E", correo: `e2e-esq-${sufijo}@example.com`, password_hash: "e2e-sin-login", correo_verificado_at: new Date().toISOString() },
  });
  D.alumno.id = a.data[0].id;
  await rest("inscripciones", { method: "POST", body: { tenant_id: D.tenantId, alumno_id: D.alumno.id, curso_id: D.curso, estado: "activa", origen: "pagina" } });
  const s = nuevaSesion();
  D.alumno.token = s.token;
  await rest("alumno_tokens", {
    method: "POST",
    body: { tenant_id: D.tenantId, alumno_id: D.alumno.id, tipo: "sesion", token_hash: s.hash, expira_at: new Date(Date.now() + 3600e3).toISOString() },
  });
});

test.afterAll(async () => {
  if (!D.tenantId) return;
  if (D.alumno.id) await rest("alumnos", { method: "DELETE", query: `tenant_id=eq.${D.tenantId}&id=eq.${D.alumno.id}` });
  if (D.curso) await rest("cursos", { method: "DELETE", query: `tenant_id=eq.${D.tenantId}&id=eq.${D.curso}` });
});

function escritorio(info: TestInfo) {
  test.skip(info.project.name !== "escritorio", "se prueba solo en escritorio");
}

async function conSesion(page: import("@playwright/test").Page, baseURL: string | undefined) {
  await page.context().addCookies([{ name: "av_alumno", value: D.alumno.token, url: baseURL! }]);
}

/** Marca una lección como completada (idempotente: borra antes cualquier progreso previo de esa lección). */
async function completar(leccion: string) {
  await rest("progreso", { method: "DELETE", query: `tenant_id=eq.${D.tenantId}&alumno_id=eq.${D.alumno.id}&leccion_id=eq.${leccion}` });
  const r = await rest("progreso", {
    method: "POST",
    body: { tenant_id: D.tenantId, curso_id: D.curso, leccion_id: leccion, alumno_id: D.alumno.id, completada_at: new Date().toISOString() },
  });
  expect(r.status, "insertar progreso").toBe(201);
}

async function sinDesborde(page: import("@playwright/test").Page) {
  const [ancho, vista] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  expect(ancho, "sin desplazamiento horizontal").toBeLessThanOrEqual(vista);
}

// ============================ 1. Alumno ============================

test("primera entrada al curso: aterriza en la presentación del primer módulo", async ({ page, baseURL }) => {
  await rest("progreso", { method: "DELETE", query: `tenant_id=eq.${D.tenantId}&alumno_id=eq.${D.alumno.id}` });
  await conSesion(page, baseURL);
  await page.goto(`/aprender/${D.curso}`);
  await expect(page).toHaveURL(new RegExp(`/aprender/${D.curso}/modulo/${D.m1}$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Primeros pasos");
  await expect(page.getByText("Módulo 1 de 2")).toBeVisible();
  await expect(page.getByText("2 lecciones · 15 min")).toBeVisible();
  await expect(page.getByText("Presentación del primer módulo de prueba.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Qué aprenderás" })).toBeVisible();
  await expect(page.getByText("Entender A")).toBeVisible();
  await expect(page.getByRole("link", { name: "Empezar el módulo" })).toHaveAttribute("href", `/aprender/${D.curso}/${D.l1}`);
  await expect(page.locator(".al-mp__item")).toHaveCount(2);
  await sinDesborde(page);
});

test("«Empezar el módulo» lleva a la primera lección y las migas vuelven al módulo", async ({ page, baseURL }, info) => {
  escritorio(info);
  await conSesion(page, baseURL);
  await page.goto(`/aprender/${D.curso}/modulo/${D.m1}`);
  await page.getByRole("link", { name: "Empezar el módulo" }).click();
  await expect(page).toHaveURL(new RegExp(`/aprender/${D.curso}/${D.l1}$`));
  await page.locator(".al-crumbs").getByRole("link", { name: "Módulo 1" }).click();
  await expect(page).toHaveURL(new RegExp(`/modulo/${D.m1}$`));
});

test("con avance: la entrada va a la lección donde quedó y el módulo ofrece «Continuar»", async ({ page, baseURL }) => {
  await completar(D.l1);
  await conSesion(page, baseURL);
  await page.goto(`/aprender/${D.curso}`);
  await expect(page).toHaveURL(new RegExp(`/aprender/${D.curso}/${D.l2}$`));
  await page.goto(`/aprender/${D.curso}/modulo/${D.m1}`);
  await expect(page.getByRole("link", { name: "Continuar" })).toHaveAttribute("href", `/aprender/${D.curso}/${D.l2}`);
  await expect(page.locator(".al-bar__row").getByText("1 de 2", { exact: true })).toBeVisible();
  await expect(page.locator(".al-mp__item .al-dot--ok")).toHaveCount(1);
  await sinDesborde(page);
});

test("al terminar el módulo, la lección ofrece «Siguiente módulo» y el módulo queda completo", async ({ page, baseURL }) => {
  await completar(D.l2);
  await conSesion(page, baseURL);
  await page.goto(`/aprender/${D.curso}/${D.l2}`);
  const sig = page.getByRole("link", { name: "Siguiente módulo →" });
  await expect(sig).toHaveAttribute("href", `/aprender/${D.curso}/modulo/${D.m2}`);
  await sig.click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Seguir avanzando");
  await expect(page.getByText("Módulo 2 de 2")).toBeVisible();
  await page.getByRole("link", { name: "← Módulo anterior" }).click();
  await expect(page.getByText("✓ Módulo completado")).toBeVisible();
  await expect(page.getByRole("link", { name: "Módulo siguiente →" })).toBeVisible();
  await sinDesborde(page);
});

test("módulo inexistente o ajeno al curso: 404; sin sesión: ingresar", async ({ page, baseURL, browser }, info) => {
  escritorio(info);
  await conSesion(page, baseURL);
  const r = await page.goto(`/aprender/${D.curso}/modulo/${randomUUID()}`);
  expect(r?.status()).toBe(404);
  const ctx = await browser.newContext({ baseURL });
  const res = await ctx.request.get(`/aprender/${D.curso}/modulo/${D.m1}`, { maxRedirects: 0 });
  expect([302, 303, 307, 308]).toContain(res.status());
  expect(res.headers()["location"]).toContain("/ingresar");
  await ctx.close();
});

// ============================ 2. Creador (solo local, modo demo) ============================

test.describe("creador: esquema del curso", () => {
  test.skip(() => !CREADOR_LOCAL, "requiere el panel local en modo demo con ALLOW_DEMO_TENANT=true y DEMO_TENANT_SLUG igual a E2E_TENANT");

  const urlEsquema = () => `${PANEL}/cursos/${D.curso}/editar?paso=estructura`;

  test("muestra módulos y lecciones, renombra y agrega una lección sin abrir el módulo", async ({ page }, info) => {
    await page.goto(urlEsquema());
    if (info.project.name !== "escritorio") {
      // En móvil el esquema parte plegado.
      await expect(page.locator(".esq-lec")).toHaveCount(0);
      await page.getByRole("button", { name: "Desplegar el módulo 1" }).click();
    }
    await expect(page.locator(".esq-lec")).toHaveCount(info.project.name === "escritorio" ? 3 : 2);

    const titulo = page.getByLabel("Título de la lección 1 del módulo 1");
    await titulo.fill("Lección 1.1 renombrada");
    await page.getByRole("button", { name: "+ Agregar lección" }).first().click();
    await expect(page.getByLabel("Título de la lección 3 del módulo 1")).toHaveValue("Nueva lección");
    await expect(page.locator("[role=status]").filter({ hasText: /guardado/i }).first()).toBeVisible({ timeout: 15_000 });

    const guardado = await rest("lecciones", { query: `select=titulo&tenant_id=eq.${D.tenantId}&modulo_id=eq.${D.m1}&order=orden` });
    expect(guardado.data.map((l: { titulo: string }) => l.titulo)).toEqual(["Lección 1.1 renombrada", "Lección 1.2", "Nueva lección"]);
    if (info.project.name !== "escritorio") await sinDesborde(page);
  });

  test("«Editar» abre la pantalla del módulo con esa lección desplegada", async ({ page }, info) => {
    await page.goto(urlEsquema());
    if (info.project.name !== "escritorio") await page.getByRole("button", { name: "Desplegar el módulo 1" }).click();
    await page.getByRole("button", { name: /^Editar la lección Lección 1\.2/ }).click();
    await expect(page).toHaveURL(new RegExp(`/modulos/${D.m1}\\?leccion=${D.l2}$`));
    await expect(page.locator(`#ed-lec-panel-${D.l2}`)).toBeVisible();
    await expect(page.locator(`#ed-lec-titulo-${D.l2}`)).toBeFocused();
  });

  test("un ?leccion= ajeno al módulo se ignora", async ({ page }) => {
    await page.goto(`${PANEL}/cursos/${D.curso}/modulos/${D.m1}?leccion=${D.l3}`);
    await expect(page.locator(".ed-lec__panel")).toHaveCount(0);
  });
});
