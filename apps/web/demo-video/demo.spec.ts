// Recorrido del video demo (B-48) contra Vercel Preview. Una prueba por escena, en serie.
// Sin GRABAR: valida el flujo (el pago se reemplaza por activar la inscripción).
// Con GRABAR=1 (--headed): graba un video por escena y espera a que el pago en Mercado
// Pago se complete a mano (login del comprador de prueba).
import { expect, test, type Browser, type Locator, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  ACADEMIA, ALUMNO, CURSO, PANEL, PRECIO, QUIZ, SUBDOMINIO, VIDEO_LECCION,
  academia, activarSinPago, completarModulosRestantes, credencialesCreadora, cursoDemo,
  limpiarAcademia, sembrarAlumnosDeFondo, urlConfirmacion,
} from "./datos-demo";

const GRABAR = process.env.GRABAR === "1";
const SALIDA = process.env.DEMO_SALIDA ?? path.join(__dirname, "..", "test-results-demo");
const ESTADO_CREADORA = path.join(SALIDA, "estado-creadora.json");
const ESCRITORIO = { width: 1920, height: 1080 };
const MOVIL = { width: 390, height: 844 };

test.describe.configure({ mode: "serial" });

// Marcas de tiempo por escena (para cortar en la edición).
const marcas: Record<string, { t: number; hito: string }[]> = {};
let inicioEscena = 0;
const marca = (escena: string, hito: string) => (marcas[escena] ??= []).push({ t: +((Date.now() - inicioEscena) / 1000).toFixed(2), hito });
test.beforeEach(() => { inicioEscena = Date.now(); });
test.afterAll(() => { mkdirSync(SALIDA, { recursive: true }); writeFileSync(path.join(SALIDA, "marcas.json"), JSON.stringify(marcas, null, 2)); });

/** Contexto por escena: escritorio 1080p o móvil 390 px, con video si GRABAR=1. */
async function abrir(browser: Browser, tipo: "escritorio" | "movil", escena: string, conSesionCreadora = false) {
  const movil = tipo === "movil";
  const context = await browser.newContext({
    locale: "es-CL",
    timezoneId: "America/Santiago",
    colorScheme: "light",
    viewport: movil ? MOVIL : ESCRITORIO,
    ...(movil ? { deviceScaleFactor: 3, isMobile: true } : {}),
    ...(conSesionCreadora ? { storageState: ESTADO_CREADORA } : {}),
    ...(GRABAR ? { recordVideo: { dir: path.join(SALIDA, escena), size: movil ? { width: 780, height: 1688 } : ESCRITORIO } } : {}),
  });
  const page = await context.newPage();
  if (GRABAR) await page.addInitScript({ path: path.join(__dirname, "cursor.js") });
  return { context, page };
}
async function clic(page: Page, loc: Locator) {
  if (GRABAR) {
    await loc.scrollIntoViewIfNeeded();
    const b = await loc.boundingBox();
    if (b) await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 20 });
  }
  await loc.click();
}
async function escribir(page: Page, loc: Locator, texto: string, corto = true) {
  await clic(page, loc);
  await loc.fill("");
  if (GRABAR && corto) await loc.pressSequentially(texto, { delay: 35 });
  else await loc.fill(texto);
}
/** El aviso de medición de la academia tapa media pantalla en móvil: se acepta al entrar. */
async function aceptarMedicion(page: Page) {
  const b = page.getByRole("button", { name: "Aceptar", exact: true });
  if (await b.isVisible({ timeout: 4000 }).catch(() => false)) await clic(page, b);
}
const pausa = (page: Page, ms: number) => (GRABAR ? page.waitForTimeout(ms) : Promise.resolve());

let tenantId = "";
let curso: { id: string; slug: string; estado: string };

test.describe("creadora", () => {
  test("escena 1 · crea su academia", async ({ browser }) => {
    await limpiarAcademia();
    const { context, page } = await abrir(browser, "escritorio", "escena-1");
    const cred = credencialesCreadora();
    await page.goto(`${PANEL}/login`);
    await page.getByRole("textbox", { name: "Correo electrónico" }).fill(cred.email);
    await page.getByRole("textbox", { name: "Contraseña" }).fill(cred.password);
    await page.getByRole("button", { name: "Ingresar" }).click();
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 30_000 });
    marca("escena-1", "bienvenida");
    await expect(page.getByText("Ponerle precio a un curso y cobrar con Mercado Pago.")).toBeVisible();
    await pausa(page, 1500);
    // Reintenta: un clic antes de que React hidrate la página no hace nada.
    await expect(async () => {
      await clic(page, page.getByRole("button", { name: "Empezar" }));
      await expect(page.getByRole("heading", { name: "Tu academia", level: 1 })).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 20_000 });
    marca("escena-1", "tu-academia");
    await escribir(page, page.getByRole("textbox", { name: "Nombre de tu academia" }), "Finanzas Claras");
    await escribir(page, page.getByRole("textbox", { name: "Frase(opcional)" }), "Finanzas personales sin enredos");
    await escribir(page, page.getByRole("textbox", { name: "Dirección de tu academia" }), SUBDOMINIO);
    await expect(page.getByRole("status").filter({ hasText: `Disponible: ${SUBDOMINIO}.dev.goavantia.com` })).toBeVisible({ timeout: 15_000 });
    await pausa(page, 800);
    await clic(page, page.getByRole("button", { name: "Continuar" }));
    marca("escena-1", "color");
    await clic(page, page.getByRole("button", { name: "Usar #0F766E" }));
    await pausa(page, 1500);
    await clic(page, page.getByRole("button", { name: "Entrar a mi espacio" }));
    await page.waitForURL((u) => !u.pathname.startsWith("/onboarding"), { timeout: 30_000 });
    marca("escena-1", "espacio");
    await pausa(page, 1500);
    tenantId = (await academia())!.id;
    mkdirSync(SALIDA, { recursive: true });
    await context.storageState({ path: ESTADO_CREADORA });
    await context.close();
  });

  test("escena 2 · arma y publica su curso", async ({ browser }) => {
    const { context, page } = await abrir(browser, "escritorio", "escena-2", true);
    tenantId ||= (await academia())!.id;
    await page.goto(`${PANEL}/cursos/nuevo`);
    marca("escena-2", "crear");
    await clic(page, page.getByRole("button", { name: /Con una estructura sugerida/ }));
    await page.waitForURL(/\/cursos\/[0-9a-f-]{36}\/editar/, { timeout: 30_000 });
    marca("escena-2", "esencial");
    await escribir(page, page.getByRole("textbox", { name: "Título del curso" }), CURSO.titulo);
    await escribir(page, page.getByRole("textbox", { name: "Descripción" }), CURSO.descripcion, false);
    await clic(page, page.getByRole("button", { name: "Siguiente" }));
    await escribir(page, page.getByRole("textbox", { name: "Objetivo 1" }), CURSO.objetivo, false);
    await clic(page, page.getByRole("button", { name: "Siguiente" }));
    marca("escena-2", "estructura");
    const m1 = page.getByRole("textbox", { name: "Nombre del módulo 1" });
    await escribir(page, m1, CURSO.modulo1);
    await m1.blur();
    await clic(page, page.getByRole("button", { name: "+ Agregar lección" }).first());
    const l1 = page.getByRole("textbox", { name: "Título de la lección 1 del módulo 1" });
    await escribir(page, l1, CURSO.leccion1);
    await l1.blur();
    await clic(page, page.getByRole("button", { name: /Editar la lección/ }).first());
    marca("escena-2", "leccion-video");
    await page.waitForURL(/\/modulos\//, { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "Lecciones", level: 2 })).toBeVisible();
    const cabecera = page.getByRole("button", { name: new RegExp(`^${CURSO.leccion1} Video`) });
    await expect(cabecera).toBeVisible();
    if ((await cabecera.getAttribute("aria-expanded")) !== "true") await clic(page, cabecera);
    const video = page.getByRole("textbox", { name: "Enlace del video" });
    await escribir(page, video, VIDEO_LECCION, false);
    await escribir(page, page.getByRole("textbox", { name: "Descripción breve(opcional)" }), CURSO.leccion1Desc, false);
    await page.getByRole("textbox", { name: "Descripción breve(opcional)" }).blur();
    await expect(page.getByRole("button", { name: new RegExp(`^${CURSO.leccion1} Video Listo`) })).toBeVisible({ timeout: 15_000 });
    marca("escena-2", "quiz");
    await clic(page, page.getByRole("button", { name: "Agregar quiz" }));
    for (const g of QUIZ) {
      await clic(page, page.getByRole("button", { name: "+ Agregar pregunta" }));
      await escribir(page, page.getByRole("textbox", { name: "Pregunta" }), g.q, false);
      for (const [k, txt] of g.r.entries()) await escribir(page, page.getByRole("textbox", { name: `Respuesta ${"ABC"[k]}` }), txt, false);
      await clic(page, page.getByRole("group", { name: /Respuestas/ }).getByRole("radio").nth(g.c));
      await escribir(page, page.getByRole("textbox", { name: "Explicación(opcional)" }), g.e, false);
      await clic(page, page.getByRole("button", { name: "Listo" }));
    }
    await expect(page.getByText("3 preguntas")).toBeVisible();
    marca("escena-2", "corte-modulos");
    // Corte: los módulos 2 y 3 se completan fuera de cámara.
    curso = await cursoDemo(tenantId);
    await completarModulosRestantes(tenantId, curso.id);
    await page.goto(`${PANEL}/cursos/${curso.id}/editar`);
    marca("escena-2", "acceso");
    await clic(page, page.getByRole("button", { name: "5 Acceso" }));
    await clic(page, page.getByRole("radio", { name: /Cualquiera con el enlace/ }));
    await escribir(page, page.getByRole("textbox", { name: "Precio (CLP)" }), PRECIO);
    await page.getByRole("textbox", { name: "Precio (CLP)" }).blur();
    await pausa(page, 1200);
    marca("escena-2", "publicar");
    await clic(page, page.getByRole("button", { name: "6 Revisar y publicar" }));
    await expect(page.getByText("$19.990")).toBeVisible();
    await clic(page, page.getByRole("button", { name: "Publicar curso" }));
    const confirmar = page.getByRole("dialog").getByRole("button", { name: /Publicar/ });
    if (await confirmar.isVisible({ timeout: 3000 }).catch(() => false)) await clic(page, confirmar);
    await expect.poll(async () => (await cursoDemo(tenantId)).estado, { timeout: 20_000 }).toBe("publicado");
    marca("escena-2", "publicado");
    await pausa(page, 2000);
    curso = await cursoDemo(tenantId);
    await context.close();
    // Fuera de cámara: alumnos de fondo para el Inicio (rótulo «Datos de demostración»).
    await sembrarAlumnosDeFondo(tenantId, curso.id);
  });
});

test.describe("alumno", () => {
  test("escena 3 · se inscribe y paga", async ({ browser }) => {
    const { context, page } = await abrir(browser, "movil", "escena-3");
    tenantId ||= (await academia())!.id;
    curso ??= await cursoDemo(tenantId);
    await page.goto(`${ACADEMIA}/curso/${curso.slug}`);
    marca("escena-3", "ficha");
    await aceptarMedicion(page);
    await expect(page.getByText(/Avantia/i)).toHaveCount(0);
    await pausa(page, 1500);
    await clic(page, page.getByRole("link", { name: "Inscribirme por $19.990" }).first());
    await expect(page).toHaveURL(/\/registro/);
    marca("escena-3", "registro");
    await escribir(page, page.getByLabel("Nombre y apellido"), ALUMNO.nombre);
    await escribir(page, page.getByLabel("Correo"), ALUMNO.correo);
    await escribir(page, page.getByLabel("Contraseña"), ALUMNO.clave);
    await clic(page, page.getByLabel(/Acepto los/));
    await clic(page, page.getByRole("button", { name: "Crear mi cuenta" }));
    await expect(page.getByRole("status")).toContainText("Te enviamos un enlace");
    marca("escena-3", "corte-confirmacion");
    // Corte: el correo de confirmación (no se envía a @demo.invalid) se reemplaza por un token conocido.
    await page.goto(await urlConfirmacion(tenantId, ALUMNO.correo));
    await clic(page, page.getByRole("button", { name: /Confirmar mi correo/ }));
    await expect(page).toHaveURL(/\/mis-cursos/);
    await page.goto(`${ACADEMIA}/curso/${curso.slug}`);
    marca("escena-3", "pagar");
    await clic(page, page.getByRole("button", { name: /^(Pagar|Inscribirme por) \$19\.990$/ }));
    await page.waitForURL(/mercadopago/, { timeout: 30_000 });
    marca("escena-3", "checkout");
    if (GRABAR) {
      // Pago a mano: login del comprador de prueba y tarjeta APRO. La grabación sigue sola.
      await page.waitForURL(/\/pago\/retorno/, { timeout: 12 * 60_000 });
      marca("escena-3", "retorno");
      await expect(page.getByRole("heading", { name: "¡Pago aprobado!" })).toBeVisible({ timeout: 30_000 });
      await pausa(page, 2500);
    } else {
      await activarSinPago(tenantId, ALUMNO.correo);
    }
    await context.close();
  });

  test("escena 4 · aprende y repasa", async ({ browser }) => {
    const { context, page } = await abrir(browser, "movil", "escena-4");
    tenantId ||= (await academia())!.id;
    curso ??= await cursoDemo(tenantId);
    await page.goto(`${ACADEMIA}/ingresar`);
    await page.getByLabel("Correo").fill(ALUMNO.correo);
    await page.getByLabel("Contraseña").fill(ALUMNO.clave);
    await page.getByRole("button", { name: "Ingresar" }).click();
    await expect(page).toHaveURL(/\/mis-cursos/);
    await aceptarMedicion(page);
    await page.goto(`${ACADEMIA}/aprender/${curso.id}`);
    marca("escena-4", "modulo");
    await expect(page.getByRole("heading", { name: CURSO.modulo1 })).toBeVisible({ timeout: 20_000 });
    await pausa(page, 2000);
    await clic(page, page.getByRole("link", { name: "Empezar el módulo" }).or(page.getByRole("button", { name: "Empezar el módulo" })));
    marca("escena-4", "leccion");
    await expect(page.getByRole("heading", { name: CURSO.leccion1 })).toBeVisible({ timeout: 20_000 });
    await pausa(page, 5000);
    await clic(page, page.getByRole("button", { name: /Marcar como completada/ }));
    marca("escena-4", "completada");
    await pausa(page, 1500);
    marca("escena-4", "quiz");
    await clic(page, page.getByRole("link", { name: "Hacer el quiz" }));
    // 1 y 3 bien, 2 mal: así se ve la explicación de un error.
    for (const [i, g] of QUIZ.entries()) {
      await expect(page.getByRole("heading", { name: g.q, level: 1 })).toBeVisible({ timeout: 15_000 });
      const opcion = i === 1 ? g.r[1] : g.r[g.c];
      await clic(page, page.getByRole("radio", { name: opcion }));
      await clic(page, page.getByRole("button", { name: "Responder" }));
      await expect(page.getByText(g.e)).toBeVisible({ timeout: 10_000 });
      marca("escena-4", `respuesta-${i + 1}`);
      await pausa(page, 2500);
      await clic(page, page.getByRole("button", { name: /Siguiente|Ver (mi )?resultado|Terminar|Continuar/ }).or(page.getByRole("link", { name: /Siguiente|Ver (mi )?resultado|Terminar|Continuar/ })).first());
    }
    await page.waitForTimeout(1500);
    marca("escena-4", "resultado");
    await pausa(page, 3000);
    await context.close();
  });
});

test.describe("creadora ve quién aprende", () => {
  test("escena 5 · inicio de la creadora", async ({ browser }) => {
    const { context, page } = await abrir(browser, "escritorio", "escena-5", true);
    await page.goto(`${PANEL}/inicio`);
    marca("escena-5", "inicio");
    await expect(page.getByText(ALUMNO.nombre).first()).toBeVisible({ timeout: 30_000 });
    await pausa(page, 4000);
    await context.close();
  });
});
