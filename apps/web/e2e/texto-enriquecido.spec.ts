import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { E, KEY, URL_DB, nuevaSesion, rest } from "./helpers/datos";

// Texto enriquecido de las lecciones (ADR 035) de punta a punta, con datos reales de Supabase.
// Crea SU PROPIO curso, lección y alumno con un sufijo aleatorio y los borra al final.
//   1. Alumno (cualquier despliegue): tabla, avisos, pestañas con teclado, tarjetas, desplegable,
//      código y tareas se ven; el HTML del texto no se ejecuta; sin desborde horizontal en móvil.
//   2. Creador (solo local, en modo demo): la barra inserta bloques, el texto se guarda solo y la
//      vista previa los muestra.
//
// Uso (desde apps/web, con .env.local y `npm run dev` en otra terminal):
//   E2E_TENANT=academia-avantia npx playwright test texto-enriquecido --project=escritorio
//   E2E_TENANT=academia-avantia npx playwright test texto-enriquecido --project=movil-360 --project=movil-390

const SUB = process.env.E2E_TENANT ?? "prueba";
const PUERTO = process.env.E2E_PORT ?? "3000";
const PANEL = process.env.E2E_PANEL_URL ?? `http://localhost:${PUERTO}`;
const CREADOR_LOCAL = PANEL.startsWith("http://localhost") && E.ALLOW_DEMO_TENANT === "true" && E.DEMO_TENANT_SLUG === SUB;

const sufijo = randomUUID().slice(0, 8);
const D = { tenantId: "", curso: "", modulo: "", leccion: "", alumno: { id: "", token: "" } };

const TEXTO = [
  "# Resumen",
  "",
  "Usa `SUM()` con **cuidado** y ==resalta== lo clave, ~~sin~~ errores.",
  "",
  "<script>window.__xss = 1</script> <img src=x onerror=\"window.__xss = 2\">",
  "",
  "> [!consejo] Atajo útil",
  "> Prueba primero con pocos datos.",
  "",
  "> [!advertencia]",
  "> No borres la hoja original.",
  "",
  "| Función | Uso | Costo |",
  "| :--- | :---: | ---: |",
  "| BUSCARV | Buscar un valor en una tabla larga y devolver otra columna asociada | 10 |",
  "| SUMAR.SI | Sumar con condición | 5 |",
  "",
  "- [x] Leer la guía",
  "- [ ] Hacer el ejercicio",
  "",
  ":::pestanas",
  "=== Excel",
  "Abre **Excel** y pega los datos.",
  "=== Python",
  "```python",
  "import pandas as pd",
  "df = pd.read_csv('datos.csv')  # una línea de código bastante larga para obligar a desplazarla en pantallas angostas",
  "```",
  ":::",
  "",
  ":::tarjetas",
  "=== Paso uno",
  "Ordena los datos.",
  "=== Paso dos",
  "Limpia los vacíos.",
  "=== Paso tres",
  "Haz la tabla dinámica.",
  ":::",
  "",
  ":::desplegable ¿Y si falla?",
  "Revisa que no haya celdas combinadas.",
  ":::",
].join("\n");

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  test.skip(!URL_DB || !KEY, "faltan credenciales de Supabase");
  const t = await rest("tenants", { query: `select=id&subdomain=eq.${SUB}` });
  D.tenantId = t.data?.[0]?.id;
  test.skip(!D.tenantId, `no existe la academia ${SUB}`);

  const c = await rest("cursos", {
    method: "POST",
    body: { tenant_id: D.tenantId, slug: `e2e-txt-${sufijo}`, titulo: `Curso E2E texto ${sufijo}`, descripcion: "Curso de prueba automática del texto enriquecido.", estado: "publicado", acceso: "enlace", published_at: new Date().toISOString() },
  });
  D.curso = c.data[0].id;
  const m = await rest("modulos", { method: "POST", body: { tenant_id: D.tenantId, curso_id: D.curso, titulo: "Módulo 1: Texto", orden: 0 } });
  D.modulo = m.data[0].id;
  const l = await rest("lecciones", {
    method: "POST",
    body: { tenant_id: D.tenantId, curso_id: D.curso, modulo_id: D.modulo, titulo: "Una lección rica", tipo: "texto", contenido_texto: TEXTO, orden: 1 },
  });
  D.leccion = l.data[0].id;

  const a = await rest("alumnos", {
    method: "POST",
    body: { tenant_id: D.tenantId, nombre: "Alumno texto E2E", correo: `e2e-txt-${sufijo}@example.com`, password_hash: "e2e-sin-login", correo_verificado_at: new Date().toISOString() },
  });
  D.alumno.id = a.data[0].id;
  await rest("inscripciones", {
    method: "POST",
    body: { tenant_id: D.tenantId, alumno_id: D.alumno.id, curso_id: D.curso, estado: "activa", origen: "pagina" },
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
  if (D.curso) await rest("cursos", { method: "DELETE", query: `tenant_id=eq.${D.tenantId}&id=eq.${D.curso}` });
});

async function sinDesborde(page: import("@playwright/test").Page) {
  const [ancho, vista] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  expect(ancho, "sin desplazamiento horizontal").toBeLessThanOrEqual(vista);
}

// ============================ 1. Alumno ============================

test("el alumno ve tabla, avisos, tareas, tarjetas, desplegable y código; el HTML no se ejecuta", async ({ page, baseURL }, info) => {
  await page.context().addCookies([{ name: "av_alumno", value: D.alumno.token, url: baseURL! }]);
  await page.goto(`/aprender/${D.curso}/${D.leccion}`);
  const md = page.locator(".fc-md");

  await expect(md.locator("code").first()).toHaveText("SUM()");
  await expect(md.locator("mark")).toHaveText("resalta");
  await expect(md.locator("del")).toHaveText("sin");

  // El HTML crudo queda como texto: no hay <script> ni <img> del creador, y nada se ejecutó.
  await expect(md.locator("script, img")).toHaveCount(0);
  await expect(md).toContainText("<script>window.__xss = 1</script>");
  expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();

  await expect(md.locator(".fc-aviso--consejo .fc-aviso__t")).toHaveText("Atajo útil");
  await expect(md.locator(".fc-aviso--advertencia .fc-aviso__t")).toHaveText("Advertencia");

  const tabla = md.getByRole("region", { name: "Tabla" });
  await expect(tabla.getByRole("columnheader")).toHaveText(["Función", "Uso", "Costo"]);
  await expect(tabla.getByRole("row")).toHaveCount(3);
  await expect(tabla.locator("td").first()).toHaveText("BUSCARV");

  await expect(md.locator(".fc-tareas li")).toHaveCount(2);
  await expect(md.locator(".fc-tareas li").first()).toContainText("Hecho:");
  await expect(md.locator(".fc-tareas li").nth(1)).toContainText("Pendiente:");

  await expect(md.locator(".fc-tarjeta")).toHaveCount(3);

  const det = md.locator("details.fc-desplegable");
  await expect(det.getByText("Revisa que no haya celdas combinadas.")).toBeHidden();
  await det.locator("summary").click();
  await expect(det.getByText("Revisa que no haya celdas combinadas.")).toBeVisible();

  // Los títulos de dentro de los bloques no cambian el índice: solo «Resumen» (1 título) → sin índice.
  await expect(page.getByRole("navigation", { name: "En esta lección" })).toHaveCount(0);

  if (info.project.name !== "escritorio") await sinDesborde(page);
  await page.screenshot({ path: test.info().outputPath("alumno.png"), fullPage: true });
});

test("pestañas: teclado (flechas, Inicio, Fin) y un solo panel visible", async ({ page, baseURL }) => {
  await page.context().addCookies([{ name: "av_alumno", value: D.alumno.token, url: baseURL! }]);
  await page.goto(`/aprender/${D.curso}/${D.leccion}`);
  const tabs = page.getByRole("tablist");
  const excel = tabs.getByRole("tab", { name: "Excel" });
  const python = tabs.getByRole("tab", { name: "Python" });
  await expect(excel).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toHaveCount(1); // el otro panel está oculto
  await expect(page.getByRole("tabpanel")).toContainText("Abre Excel");

  await excel.focus();
  await page.keyboard.press("ArrowRight");
  await expect(python).toBeFocused();
  await expect(python).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toContainText("import pandas");
  await page.keyboard.press("ArrowRight"); // da la vuelta
  await expect(excel).toBeFocused();
  await page.keyboard.press("End");
  await expect(python).toBeFocused();
  await page.keyboard.press("Home");
  await expect(excel).toBeFocused();

  // Cada pestaña es alcanzable con el ratón/toque.
  await python.click();
  await expect(page.locator(".fc-codigo pre")).toBeVisible();
});

// ============================ 2. Creador (local, modo demo) ============================

test.describe("creador", () => {
  test.skip(() => !CREADOR_LOCAL, "requiere el panel local en modo demo con ALLOW_DEMO_TENANT=true y DEMO_TENANT_SLUG igual a E2E_TENANT");

  test("la barra inserta una tabla y un aviso, se guarda solo y la vista previa los muestra", async ({ page }, info) => {
    await page.goto(`${PANEL}/cursos/${D.curso}/modulos/${D.modulo}?leccion=${D.leccion}`);
    const area = page.locator(`#ed-lec-texto-${D.leccion}`);
    await expect(area).toBeVisible();
    await area.fill("");

    await page.getByRole("button", { name: "Tabla", exact: true }).click();
    await expect(area).toHaveValue(/\| Columna 1 \| Columna 2 \| Columna 3 \|/);
    // Lo insertado queda seleccionado para escribir encima.
    expect(await area.evaluate((el: HTMLTextAreaElement) => el.value.slice(el.selectionStart, el.selectionEnd))).toBe("Columna 1");
    await page.keyboard.type("Producto");

    await area.press("Control+End"); // el cursor queda tras la tabla
    await page.getByRole("button", { name: "Aviso: consejo" }).click();
    await expect(area).toHaveValue(/> \[!consejo\] Título/);

    // Atajo de teclado: Ctrl+B sobre el texto elegido.
    await area.press("Control+End");
    await page.keyboard.type("\n\nhola");
    await area.press("Shift+Home");
    await area.press("Control+b");
    await expect(area).toHaveValue(/\*\*hola\*\*$/);

    await expect(page.locator("[role=status]").filter({ hasText: /guardado/i }).first()).toBeVisible({ timeout: 15_000 });
    const g = await rest("lecciones", { query: `select=contenido_texto&tenant_id=eq.${D.tenantId}&id=eq.${D.leccion}` });
    expect(g.data[0].contenido_texto).toContain("| Producto | Columna 2 | Columna 3 |");
    expect(g.data[0].contenido_texto).toContain("> [!consejo] Título");
    expect(g.data[0].contenido_texto).toMatch(/^\| Producto \|/); // la tabla quedó entera

    await page.getByRole("button", { name: "Ver cómo se ve" }).click();
    const prev = page.locator(".ed-md-prev");
    await expect(prev.getByRole("columnheader").first()).toHaveText("Producto");
    await expect(prev.locator(".fc-aviso--consejo")).toBeVisible();
    await expect(prev.locator("strong")).toHaveText("hola");

    if (info.project.name !== "escritorio") await sinDesborde(page);
    await page.screenshot({ path: info.outputPath("creador.png"), fullPage: true });
  });

  test("la barra se puede recorrer con teclado y cada botón mide al menos 44 px", async ({ page }) => {
    await page.goto(`${PANEL}/cursos/${D.curso}/modulos/${D.modulo}?leccion=${D.leccion}`);
    const botones = page.getByRole("toolbar", { name: "Formato del texto" }).getByRole("button");
    expect(await botones.count()).toBeGreaterThanOrEqual(20);
    for (const caja of await botones.evaluateAll((bs) => bs.map((b) => b.getBoundingClientRect().height))) expect(caja).toBeGreaterThanOrEqual(43.5);
    await page.getByRole("button", { name: "Guía de formato" }).or(page.getByText("Guía de formato")).first().click();
    await expect(page.getByRole("table", { name: "Sintaxis admitida" })).toBeVisible();
  });
});
