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
const D = { tenantId: "", slug: "", curso: "", m1: "", m2: "", l1: "", l2: "", l3: "", alumno: { id: "", token: "" }, larga: { curso: "", modulo: "", leccion: "" } };

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  test.skip(!URL_DB || !KEY, "faltan credenciales de Supabase");
  const t = await rest("tenants", { query: `select=id&subdomain=eq.${SUB}` });
  D.tenantId = t.data?.[0]?.id;
  test.skip(!D.tenantId, `no existe la academia ${SUB}`);

  D.slug = `e2e-esq-${sufijo}`;
  const c = await rest("cursos", {
    method: "POST",
    body: { tenant_id: D.tenantId, slug: D.slug, titulo: `Curso E2E esquema ${sufijo}`, descripcion: "Curso de prueba automática del flujo curso, módulo y lección.", estado: "publicado", acceso: "enlace", published_at: new Date().toISOString() },
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

  // Curso con una lección de texto larga y con títulos, para el índice «En esta lección» (ADR 033).
  const secciones = ["Introducción", "Conceptos clave", "Un caso práctico", "Errores frecuentes", "Cierre"];
  const relleno = "Texto de relleno para que la lección sea larga y se pueda hacer scroll. ".repeat(4);
  const texto = secciones
    .map((t, i) => {
      const parrafos = Array.from({ length: 6 }, (_, k) => `Párrafo ${k + 1} de ${t}. ${relleno}`);
      return [`${i === 2 ? "##" : "#"} ${t}`, ...parrafos].join("\n\n");
    })
    .join("\n\n");
  const cL = await rest("cursos", {
    method: "POST",
    body: { tenant_id: D.tenantId, slug: `e2e-larga-${sufijo}`, titulo: `Curso E2E lección larga ${sufijo}`, descripcion: "Curso de prueba automática del índice de la lección.", estado: "publicado", acceso: "enlace", published_at: new Date().toISOString() },
  });
  D.larga.curso = cL.data[0].id;
  const mL = await rest("modulos", { method: "POST", body: { tenant_id: D.tenantId, curso_id: D.larga.curso, titulo: "Módulo 1: Lectura", orden: 0 } });
  D.larga.modulo = mL.data[0].id;
  const lL = await rest("lecciones", {
    method: "POST",
    body: { tenant_id: D.tenantId, curso_id: D.larga.curso, modulo_id: D.larga.modulo, titulo: "Una lección larga", tipo: "texto", contenido_texto: texto, orden: 1 },
  });
  D.larga.leccion = lL.data[0].id;

  const a = await rest("alumnos", {
    method: "POST",
    body: { tenant_id: D.tenantId, nombre: "Alumno esquema E2E", correo: `e2e-esq-${sufijo}@example.com`, password_hash: "e2e-sin-login", correo_verificado_at: new Date().toISOString() },
  });
  D.alumno.id = a.data[0].id;
  await rest("inscripciones", {
    method: "POST",
    body: [D.curso, D.larga.curso].map((c) => ({ tenant_id: D.tenantId, alumno_id: D.alumno.id, curso_id: c, estado: "activa", origen: "pagina" })),
  });
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
  for (const c of [D.curso, D.larga.curso]) if (c) await rest("cursos", { method: "DELETE", query: `tenant_id=eq.${D.tenantId}&id=eq.${c}` });
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

test("recorrido real con clics: del módulo 1 al 2 y hasta el cierre, sin tocar la base de datos", async ({ page, baseURL }) => {
  await rest("progreso", { method: "DELETE", query: `tenant_id=eq.${D.tenantId}&alumno_id=eq.${D.alumno.id}` });
  await conSesion(page, baseURL);
  // Se espera a que React hidrate el formulario: un clic antes envía el formulario de forma nativa
  // (la acción se ejecuta, pero la página no navega a la lección siguiente).
  const completar = async () => {
    await page.waitForFunction(() => {
      const f = document.querySelector("form");
      return !!f && Object.keys(f).some((k) => k.startsWith("__reactProps"));
    });
    await page.getByRole("button", { name: /Marcar como completada/ }).click();
  };

  // Entrada: presentación del módulo 1 → primera lección.
  await page.goto(`/aprender/${D.curso}`);
  await expect(page).toHaveURL(new RegExp(`/modulo/${D.m1}$`));
  await page.getByRole("link", { name: "Empezar el módulo" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Lección 1.1");

  // Lección 1.1 → pasa sola a la 1.2 (mismo módulo) y avisa los XP.
  await completar();
  await expect(page).toHaveURL(new RegExp(`/aprender/${D.curso}/${D.l2}\\?ganaste=\\d+$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Lección 1.2");
  await expect(page.getByText(/\+\d+ XP ganados/)).toBeVisible();

  // Lección 1.2 es la última del módulo: NO salta a la 2.1; se queda, ya completada, con «Siguiente módulo».
  await completar();
  await expect(page).toHaveURL(new RegExp(`/aprender/${D.curso}/${D.l2}\\?ganaste=\\d+$`));
  await expect(page.getByText("✓ Completada")).toBeVisible();
  await expect(page.getByRole("link", { name: "Siguiente →" })).toHaveCount(0);
  await page.getByRole("link", { name: "Siguiente módulo →" }).click();

  // Presentación del módulo 2, sin avance todavía.
  await expect(page).toHaveURL(new RegExp(`/modulo/${D.m2}$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Seguir avanzando");
  await expect(page.getByText("Módulo 2 de 2")).toBeVisible();
  await expect(page.getByText("Presentación del segundo módulo.")).toBeVisible();
  await expect(page.locator(".al-bar__row").getByText("0 de 1", { exact: true })).toBeVisible();
  if ((page.viewportSize()?.width ?? 0) >= 900) {
    // El syllabus refleja el avance: módulo 1 con 2/2 y plegado; módulo 2 abierto.
    const mods = page.locator("details.al-syl__mod");
    await expect(mods.nth(0).locator("summary")).toContainText("2/2");
    await expect(mods.nth(1)).toHaveAttribute("open", "");
  }
  await sinDesborde(page);

  // El módulo 1 quedó completo y ofrece volver a mirarlo.
  await page.getByRole("link", { name: "← Módulo anterior" }).click();
  await expect(page.getByText("✓ Módulo completado")).toBeVisible();
  await page.getByRole("link", { name: "Módulo siguiente →" }).click();

  // Módulo 2: empezar, completar la única lección y llegar al cierre del curso.
  await page.getByRole("link", { name: "Empezar el módulo" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Lección 2.1");
  await completar();
  // La primera visita al cierre en `next dev` compila la ruta: puede tardar más que los 5 s habituales.
  await expect(page).toHaveURL(new RegExp(`/aprender/${D.curso}/completado$`), { timeout: 30_000 });
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Lo lograste");

  await rest("progreso", { method: "DELETE", query: `tenant_id=eq.${D.tenantId}&alumno_id=eq.${D.alumno.id}` });
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

// ---- Syllabus lateral e índice de la lección (ADR 033) ----

test("syllabus: el módulo actual está abierto, el otro plegado, y la lección actual marcada", async ({ page, baseURL }) => {
  await conSesion(page, baseURL);
  await page.goto(`/aprender/${D.curso}/${D.l2}`);
  const ancho = (page.viewportSize()?.width ?? 0) >= 900;
  if (!ancho) await page.getByRole("button", { name: "Contenido del curso" }).click();
  const sil = page.getByRole("navigation", { name: "Contenido del curso" });
  await expect(sil).toBeVisible();
  const mods = sil.locator("details.al-syl__mod");
  await expect(mods).toHaveCount(2);
  await expect(mods.nth(0)).toHaveAttribute("open", "");
  await expect(mods.nth(1)).not.toHaveAttribute("open", "");
  await expect(sil.locator('a[aria-current="page"]')).toHaveText(/Lección 1\.2/);
  await mods.nth(1).locator("summary").click();
  await expect(sil.getByRole("link", { name: /Lección 2\.1/ })).toBeVisible();
  if (ancho) {
    // A la izquierda del contenido, no a la derecha.
    const [a, b] = await Promise.all([sil.boundingBox(), page.locator(".al-leccion").boundingBox()]);
    expect(a!.x + a!.width).toBeLessThanOrEqual(b!.x + 1);
  }
  await sinDesborde(page);
});

test("índice: lista los títulos del texto, se queda fijo al hacer scroll y marca la sección leída", async ({ page, baseURL }) => {
  await conSesion(page, baseURL);
  await page.goto(`/aprender/${D.larga.curso}/${D.larga.leccion}`);
  const ancho3 = (page.viewportSize()?.width ?? 0) >= 1180;
  if (!ancho3) await page.getByRole("button", { name: "En esta lección" }).click();
  const toc = page.getByRole("navigation", { name: "En esta lección" });
  await expect(toc.getByRole("link")).toHaveText(["Introducción", "Conceptos clave", "Un caso práctico", "Errores frecuentes", "Cierre"]);
  await expect(toc.locator(".al-toc__item--3")).toHaveCount(1); // «##» se muestra como nivel 3
  await expect(toc.locator('a[aria-current="location"]')).toHaveText("Introducción");

  // Cada enlace apunta a un título real de la página.
  for (const id of await toc.getByRole("link").evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).hash.slice(1)))) {
    await expect(page.locator(`#${id}`)).toHaveCount(1);
  }

  await toc.getByRole("link", { name: "Errores frecuentes" }).click();
  await expect(page).toHaveURL(/#sec-errores-frecuentes$/);
  await expect(page.locator("#sec-errores-frecuentes")).toBeInViewport();
  if (!ancho3) await page.getByRole("button", { name: "En esta lección" }).click(); // el panel se cerró al elegir
  await expect(toc.locator('a[aria-current="location"]')).toHaveText("Errores frecuentes");

  if (ancho3) {
    // Sigue visible y fijo después de bajar: su borde superior no se va con el scroll.
    const caja = await page.locator(".al-shell__toc").boundingBox();
    expect(caja!.y).toBeGreaterThanOrEqual(0);
    expect(caja!.y).toBeLessThan(200);
  }
  await sinDesborde(page);
});

test("una lección sin títulos no muestra índice", async ({ page, baseURL }) => {
  await conSesion(page, baseURL);
  await page.goto(`/aprender/${D.curso}/${D.l1}`);
  await expect(page.getByRole("navigation", { name: "En esta lección" })).toHaveCount(0);
});

// ---- Ficha pública: presentación del módulo compartida con la pantalla del alumno (ADR 032, punto 9) ----

test("ficha pública del curso: muestra la presentación del módulo con «Qué aprenderás»", async ({ page }, info) => {
  escritorio(info);
  await page.goto(`/curso/${D.slug}`);
  await expect(page.getByText("Presentación del primer módulo de prueba.")).toBeVisible();
  await expect(page.getByText("Qué aprenderás")).toBeVisible();
  await expect(page.getByRole("list", { name: "Qué aprenderás" }).getByRole("listitem")).toHaveText(["Entender A", "Aplicar B"]);
});

// ---- Teclado: los paneles plegables y el acordeón se operan sin ratón ----

test("teclado: el panel del syllabus y el índice se abren y cierran con Enter y el acordeón con Espacio", async ({ page, baseURL }) => {
  await conSesion(page, baseURL);
  await page.goto(`/aprender/${D.larga.curso}/${D.larga.leccion}`);
  const ancho = (page.viewportSize()?.width ?? 0) >= 900;
  if (!ancho) {
    const boton = page.getByRole("button", { name: "Contenido del curso" });
    await boton.focus();
    await page.keyboard.press("Enter");
    await expect(boton).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Enter");
    await expect(boton).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByRole("navigation", { name: "Contenido del curso" })).toBeHidden();
    await boton.focus();
    await page.keyboard.press("Enter");
  }
  const resumen = page.locator("details.al-syl__mod > summary").first();
  await resumen.focus();
  await expect(page.locator("details.al-syl__mod").first()).toHaveAttribute("open", "");
  await page.keyboard.press("Space");
  await expect(page.locator("details.al-syl__mod").first()).not.toHaveAttribute("open", "");
  await page.keyboard.press("Space");
  await expect(page.locator("details.al-syl__mod").first()).toHaveAttribute("open", "");
  // Un enlace del índice se activa con Enter.
  if (!ancho || (page.viewportSize()?.width ?? 0) < 1180) {
    const t = page.getByRole("button", { name: "En esta lección" });
    await t.focus();
    await page.keyboard.press("Enter");
  }
  await page.getByRole("navigation", { name: "En esta lección" }).getByRole("link", { name: "Cierre" }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#sec-cierre$/);
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

  test("plantilla: un módulo vacío recibe Introducción, Desarrollo, Ejercicio y Resumen", async ({ page }, info) => {
    const m = await rest("modulos", { method: "POST", body: { tenant_id: D.tenantId, curso_id: D.curso, titulo: "Módulo vacío", orden: 9, descripcion: null, objetivos: [], duracion_min: null } });
    const vacio = m.data[0].id as string;
    await page.goto(urlEsquema());
    if (info.project.name !== "escritorio") await page.getByRole("button", { name: "Desplegar el módulo 3" }).click();
    await page.getByRole("button", { name: /^Usar plantilla de lecciones/ }).click();
    await expect(page.getByLabel(/Título de la lección 1 del módulo 3/)).toHaveValue("Introducción", { timeout: 15_000 });
    const filas = await rest("lecciones", { query: `select=titulo,tipo&tenant_id=eq.${D.tenantId}&modulo_id=eq.${vacio}&order=orden` });
    expect(filas.data).toEqual([
      { titulo: "Introducción", tipo: "texto" },
      { titulo: "Desarrollo", tipo: "texto" },
      { titulo: "Ejercicio", tipo: "texto" },
      { titulo: "Resumen", tipo: "texto" },
    ]);
    // Con lecciones ya creadas, el botón desaparece: no se puede duplicar.
    await expect(page.getByRole("button", { name: /^Usar plantilla de lecciones/ })).toHaveCount(0);
    await rest("modulos", { method: "DELETE", query: `tenant_id=eq.${D.tenantId}&id=eq.${vacio}` });
  });

  test("lección anterior y siguiente cruzan de un módulo a otro", async ({ page }) => {
    const ultima = (await rest("lecciones", { query: `select=id&tenant_id=eq.${D.tenantId}&modulo_id=eq.${D.m1}&order=orden.desc&limit=1` })).data[0].id as string;
    await page.goto(`${PANEL}/cursos/${D.curso}/modulos/${D.m1}?leccion=${ultima}`);
    await expect(page.locator(`#ed-lec-panel-${ultima}`)).toBeVisible();
    await page.getByRole("button", { name: /^Lección siguiente →/ }).click();
    await expect(page).toHaveURL(new RegExp(`/modulos/${D.m2}\\?leccion=${D.l3}$`));
    await expect(page.locator(`#ed-lec-panel-${D.l3}`)).toBeVisible();
    await expect(page.locator(`#ed-lec-titulo-${D.l3}`)).toBeFocused();
    await expect(page.getByRole("button", { name: /^Lección siguiente →/ })).toHaveCount(0); // es la última del curso
    await page.getByRole("button", { name: /^← Lección anterior/ }).click();
    await expect(page).toHaveURL(new RegExp(`/modulos/${D.m1}\\?leccion=${ultima}$`));
  });

  test("un ?leccion= ajeno al módulo se ignora", async ({ page }) => {
    await page.goto(`${PANEL}/cursos/${D.curso}/modulos/${D.m1}?leccion=${D.l3}`);
    await expect(page.locator(".ed-lec__panel")).toHaveCount(0);
  });
});
