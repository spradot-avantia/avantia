import { randomUUID } from "node:crypto";
import { expect, test, type Browser, type BrowserContext, type TestInfo } from "@playwright/test";
import {
  E,
  KEY,
  PDF_PRUEBA,
  URL_DB,
  existeObjeto,
  fechaEn,
  listarObjetos,
  nuevaSesion,
  quitarObjetos,
  rest,
  subirObjeto,
  urlPublica,
} from "./helpers/datos";

// Materiales con archivo (ADR 029 F2/F3 y ADR 030) de punta a punta, con datos reales de Supabase.
// Crea SUS PROPIOS cursos, alumnos, materiales y objetos del bucket con un sufijo aleatorio y los
// borra al final (no toca datos de nadie). Cubre dos mitades:
//   1. Alumno (corre contra cualquier despliegue): entrega del archivo con URL firmada, control de
//      acceso (sesión, inscripción, lección liberada, curso y tenant), página pública y diseño móvil.
//   2. Creador (solo local, en modo demo): subir un archivo desde el editor y que borrar un material,
//      una lección o un módulo elimine también el objeto del bucket.
//
// Uso (desde apps/web, con .env.local y `npm run dev` en otra terminal):
//   npx playwright test materiales --project=escritorio
// La mitad del creador solo corre si el panel local está en modo demo sobre LA MISMA academia
// (DEMO_TENANT_SLUG y ALLOW_DEMO_TENANT=true en .env.local, igual a E2E_TENANT).
// Contra producción (solo la mitad del alumno), con datos propios que se borran al final:
//   E2E_ACADEMIA_URL=https://academia-avantia.goavantia.com E2E_PANEL_URL=https://www.goavantia.com //     npx playwright test materiales --project=escritorio
// Ojo: el curso temporal queda publicado unos minutos en el catálogo público de esa academia.
// La prueba de caducidad de la URL firmada tarda 65 s: se activa con E2E_LENTO=1.

// Por defecto, la academia propia del equipo: `prueba` es la demo de otra persona y no se usa para escribir datos.
const SUB = process.env.E2E_TENANT ?? "academia-avantia";
const PUERTO = process.env.E2E_PORT ?? "3000";
const PANEL = process.env.E2E_PANEL_URL ?? `http://localhost:${PUERTO}`;
const CREADOR_LOCAL = PANEL.startsWith("http://localhost") && E.ALLOW_DEMO_TENANT === "true" && E.DEMO_TENANT_SLUG === SUB;

const sufijo = randomUUID().slice(0, 8);
const D = {
  tenantId: "",
  A: { curso: "", slug: "", modulo: "", lec1: "", lec2: "", lecDoc: { id: "", ruta: "" } },
  B: { curso: "", modulo: "", lec1: "", lec2: "", lecDoc: { id: "", ruta: "" } },
  /** Migración 0018 aplicada: las pruebas de archivos en lecciones de tipo documento se saltan si no. */
  hayLeccionArchivo: false,
  mat: {} as Record<string, { id: string; ruta: string }>,
  alumno: {} as Record<"x" | "y" | "z", { id: string; token: string }>,
};
const rutas: string[] = [];

function escritorio(info: TestInfo) {
  test.skip(info.project.name !== "escritorio", "se prueba solo en escritorio");
}

async function conSesion(
  browser: Browser,
  baseURL: string | undefined,
  token?: string,
  viewport?: { width: number; height: number } | null,
): Promise<BrowserContext> {
  const ctx = await browser.newContext({ baseURL, ...(viewport ? { viewport } : {}) });
  if (token) await ctx.addCookies([{ name: "av_alumno", value: token, url: baseURL! }]);
  return ctx;
}

async function crearMaterialArchivo(
  curso: string,
  modulo: string,
  leccion: string | null,
  titulo: string,
  orden: number,
  nombre = "guia.pdf",
) {
  const ruta = `${D.tenantId}/${curso}/${randomUUID()}.pdf`;
  await subirObjeto(ruta);
  rutas.push(ruta);
  const r = await rest("materiales", {
    method: "POST",
    body: {
      tenant_id: D.tenantId,
      curso_id: curso,
      modulo_id: modulo,
      leccion_id: leccion,
      titulo,
      origen: "archivo",
      tipo: "documento",
      storage_path: ruta,
      archivo_nombre: nombre,
      mime: "application/pdf",
      bytes: PDF_PRUEBA.length,
      orden,
    },
  });
  expect(r.status, `crear material ${titulo}`).toBe(201);
  return { id: r.data[0].id as string, ruta };
}

/** Lección de tipo documento con un PDF propio (ADR 030). `dia` = día de liberación del curso con fechas. */
async function crearLeccionDocumento(curso: string, modulo: string, titulo: string, orden: number, dia: number | null = null) {
  const ruta = `${D.tenantId}/${curso}/${randomUUID()}.pdf`;
  await subirObjeto(ruta);
  rutas.push(ruta);
  const r = await rest("lecciones", {
    method: "POST",
    body: {
      tenant_id: D.tenantId,
      curso_id: curso,
      modulo_id: modulo,
      titulo,
      tipo: "documento",
      storage_path: ruta,
      archivo_nombre: "Documento.pdf",
      contenido_tipo: "application/pdf",
      bytes: PDF_PRUEBA.length,
      orden,
      ...(dia !== null ? { dia_liberacion: dia } : {}),
    },
  });
  expect(r.status, `crear lección documento ${titulo}`).toBe(201);
  return { id: r.data[0].id as string, ruta };
}

async function crearAlumno(clave: string, correo: string, curso: string, estado: string | null, tambien?: { curso: string; estado: string }) {
  const a = await rest("alumnos", {
    method: "POST",
    body: { tenant_id: D.tenantId, nombre: `Alumno ${clave} E2E`, correo, password_hash: "e2e-sin-login", correo_verificado_at: new Date().toISOString() },
  });
  const id = a.data[0].id as string;
  const inscripciones = [
    ...(estado ? [{ curso_id: curso, estado }] : []),
    ...(tambien ? [{ curso_id: tambien.curso, estado: tambien.estado }] : []),
  ];
  if (inscripciones.length) {
    await rest("inscripciones", { method: "POST", body: inscripciones.map((i) => ({ tenant_id: D.tenantId, alumno_id: id, origen: "pagina", ...i })) });
  }
  const s = nuevaSesion();
  await rest("alumno_tokens", {
    method: "POST",
    body: { tenant_id: D.tenantId, alumno_id: id, tipo: "sesion", token_hash: s.hash, expira_at: new Date(Date.now() + 3600e3).toISOString() },
  });
  return { id, token: s.token };
}

// La suite fija su propia academia: así sus datos y sus peticiones van siempre al mismo tenant,
// sin depender del valor por defecto de playwright.config.ts (que usan otras suites).
test.use({ baseURL: process.env.E2E_ACADEMIA_URL ?? `http://${SUB}.localhost:${PUERTO}` });

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  test.skip(!URL_DB || !KEY, "faltan credenciales de Supabase");
  const t = await rest("tenants", { query: `select=id&subdomain=eq.${SUB}` });
  D.tenantId = t.data?.[0]?.id;
  test.skip(!D.tenantId, `no existe la academia ${SUB}`);
  test.skip((await rest("materiales", { query: "select=origen&limit=1" })).status !== 200, "la migración 0017 no está aplicada en esta base");

  // Curso A: a su ritmo. Módulo con presentación y dos lecciones con descripción y duración.
  D.A.slug = `e2e-mat-${sufijo}`;
  const cA = await rest("cursos", {
    method: "POST",
    body: { tenant_id: D.tenantId, slug: D.A.slug, titulo: `Curso E2E materiales ${sufijo}`, descripcion: "Curso de prueba automática de materiales con archivo para el alumno.", estado: "publicado", acceso: "enlace", published_at: new Date().toISOString() },
  });
  D.A.curso = cA.data[0].id;
  const mA = await rest("modulos", {
    method: "POST",
    body: { tenant_id: D.tenantId, curso_id: D.A.curso, titulo: "Módulo 1: Presentación del módulo", orden: 0, descripcion: "Descripción del módulo de prueba.", objetivos: ["Aprender A", "Aprender B"], duracion_min: 20 },
  });
  D.A.modulo = mA.data[0].id;
  const lA = await rest("lecciones", {
    method: "POST",
    body: [1, 2].map((n) => ({ tenant_id: D.tenantId, curso_id: D.A.curso, modulo_id: D.A.modulo, titulo: `Lección A${n}`, tipo: "texto", contenido_texto: `Contenido A${n}`, descripcion: `Qué se aprende en A${n}`, duracion_min: 8, orden: n })),
  });
  [D.A.lec1, D.A.lec2] = lA.data.map((l: { id: string }) => l.id);

  // Curso B: con fechas. Empezó hace 2 días: la lección 1 (día 0) está liberada y la 2 (día 10), no.
  const cB = await rest("cursos", {
    method: "POST",
    body: { tenant_id: D.tenantId, slug: `e2e-mat-b-${sufijo}`, titulo: `Curso E2E con fechas ${sufijo}`, descripcion: "Curso de prueba automática con fechas para la liberación de materiales.", estado: "publicado", acceso: "enlace", modalidad: "con_fechas", fecha_inicio: fechaEn(-2), fecha_termino: fechaEn(60), published_at: new Date().toISOString() },
  });
  D.B.curso = cB.data[0].id;
  const mB = await rest("modulos", { method: "POST", body: { tenant_id: D.tenantId, curso_id: D.B.curso, titulo: "Módulo B", orden: 0 } });
  D.B.modulo = mB.data[0].id;
  const lB = await rest("lecciones", {
    method: "POST",
    body: [0, 10].map((dia, i) => ({ tenant_id: D.tenantId, curso_id: D.B.curso, modulo_id: D.B.modulo, titulo: `Lección B${i + 1}`, tipo: "texto", contenido_texto: `Contenido B${i + 1}`, dia_liberacion: dia, orden: i + 1 })),
  });
  [D.B.lec1, D.B.lec2] = lB.data.map((l: { id: string }) => l.id);

  // Materiales: de una lección, de un módulo, un enlace externo y los del curso con fechas.
  D.mat.a1 = await crearMaterialArchivo(D.A.curso, D.A.modulo, D.A.lec1, "Guía de la lección A1", 0, "Guía A1.pdf");
  D.mat.aMod = await crearMaterialArchivo(D.A.curso, D.A.modulo, null, "Plantilla del módulo A", 1, "Plantilla.pdf");
  await rest("materiales", {
    method: "POST",
    body: { tenant_id: D.tenantId, curso_id: D.A.curso, modulo_id: D.A.modulo, leccion_id: D.A.lec1, titulo: "Lectura externa", origen: "enlace", tipo: "enlace", url: "https://ejemplo.cl/lectura", nota: "Lee la sección 2", orden: 2 },
  });
  D.mat.b1 = await crearMaterialArchivo(D.B.curso, D.B.modulo, D.B.lec1, "Material de B1 (liberada)", 0);
  D.mat.b2 = await crearMaterialArchivo(D.B.curso, D.B.modulo, D.B.lec2, "Material de B2 (sin liberar)", 1);
  D.mat.bMod = await crearMaterialArchivo(D.B.curso, D.B.modulo, null, "Material del módulo B", 2);

  // Lecciones de tipo documento con archivo propio (requiere la migración 0018).
  D.hayLeccionArchivo = (await rest("lecciones", { query: "select=archivo_nombre&limit=1" })).status === 200;
  if (D.hayLeccionArchivo) {
    D.A.lecDoc = await crearLeccionDocumento(D.A.curso, D.A.modulo, "Lección documento A", 3);
    D.B.lecDoc = await crearLeccionDocumento(D.B.curso, D.B.modulo, "Lección documento B sin liberar", 3, 10);
  }

  // Alumnos: X inscrito en A y B; Y solo en A; Z con inscripción cancelada en A.
  D.alumno.x = await crearAlumno("X", `e2e-x-${sufijo}@example.com`, D.A.curso, "activa", { curso: D.B.curso, estado: "activa" });
  D.alumno.y = await crearAlumno("Y", `e2e-y-${sufijo}@example.com`, D.A.curso, "activa");
  D.alumno.z = await crearAlumno("Z", `e2e-z-${sufijo}@example.com`, D.A.curso, "cancelada");
});

test.afterAll(async () => {
  if (!D.tenantId) return;
  const cursos = [D.A.curso, D.B.curso].filter(Boolean);
  for (const c of cursos) {
    const objetos = (await listarObjetos(`${D.tenantId}/${c}`)).map((n) => `${D.tenantId}/${c}/${n}`);
    await quitarObjetos([...new Set([...objetos, ...rutas.filter((r) => r.includes(`/${c}/`))])]);
  }
  const ids = Object.values(D.alumno).map((a) => a.id);
  if (ids.length) await rest("alumnos", { method: "DELETE", query: `tenant_id=eq.${D.tenantId}&id=in.(${ids.join(",")})` });
  for (const c of cursos) await rest("cursos", { method: "DELETE", query: `tenant_id=eq.${D.tenantId}&id=eq.${c}` });
});

const ruta = (curso: string, material: string) => `/aprender/${curso}/material/${material}`;
const redirige = (s: number) => [302, 303, 307, 308].includes(s);

// ============================ 1. Alumno ============================

test("alumno inscrito: 302 a una URL firmada del bucket privado que entrega el PDF", async ({ browser, baseURL }, info) => {
  escritorio(info);
  const ctx = await conSesion(browser, baseURL, D.alumno.x.token);
  const r = await ctx.request.get(ruta(D.A.curso, D.mat.a1.id), { maxRedirects: 0 });
  const loc = r.headers()["location"] ?? "";
  expect(r.status()).toBe(302);
  expect(loc).toContain("/storage/v1/object/sign/materiales/");
  expect(r.headers()["cache-control"]).toContain("no-store");
  const archivo = await fetch(loc);
  expect(archivo.status).toBe(200);
  expect(archivo.headers.get("content-type")).toContain("pdf");
  const cuerpo = Buffer.from(await archivo.arrayBuffer());
  expect(cuerpo.length).toBe(PDF_PRUEBA.length);
  expect(cuerpo.toString().startsWith("%PDF")).toBe(true);
  await ctx.close();
});

test("el bucket es privado: el objeto no se entrega sin firma", async () => {
  const res = await fetch(urlPublica(D.mat.a1.ruta));
  expect(res.status).toBeGreaterThanOrEqual(400);
  const sinToken = await fetch(`${URL_DB}/storage/v1/object/sign/materiales/${D.mat.a1.ruta}`);
  expect(sinToken.status).toBeGreaterThanOrEqual(400);
});

test("sin sesión: redirige a ingresar y no entrega nada", async ({ browser, baseURL }, info) => {
  escritorio(info);
  const ctx = await conSesion(browser, baseURL);
  const r = await ctx.request.get(ruta(D.A.curso, D.mat.a1.id), { maxRedirects: 0 });
  expect(redirige(r.status())).toBe(true);
  expect(r.headers()["location"]).toContain("/ingresar");
  await ctx.close();
});

test("ids inexistentes o inválidos: 404", async ({ browser, baseURL }, info) => {
  escritorio(info);
  const ctx = await conSesion(browser, baseURL, D.alumno.x.token);
  for (const [curso, mat] of [
    [D.A.curso, "00000000-0000-0000-0000-000000000000"],
    [D.A.curso, "no-es-un-uuid"],
    ["no-es-un-uuid", D.mat.a1.id],
  ]) {
    const r = await ctx.request.get(ruta(curso, mat), { maxRedirects: 0 });
    expect(r.status(), `${curso} / ${mat}`).toBe(404);
  }
  await ctx.close();
});

test("alumno sin inscripción en ese curso: a «Mis cursos», sin archivo", async ({ browser, baseURL }, info) => {
  escritorio(info);
  const ctx = await conSesion(browser, baseURL, D.alumno.y.token); // Y no está inscrito en B
  const r = await ctx.request.get(ruta(D.B.curso, D.mat.b1.id), { maxRedirects: 0 });
  expect(redirige(r.status())).toBe(true);
  expect(r.headers()["location"]).toContain("/mis-cursos");
  await ctx.close();
});

test("inscripción cancelada: a «Mis cursos», sin archivo", async ({ browser, baseURL }, info) => {
  escritorio(info);
  const ctx = await conSesion(browser, baseURL, D.alumno.z.token);
  const r = await ctx.request.get(ruta(D.A.curso, D.mat.a1.id), { maxRedirects: 0 });
  expect(redirige(r.status())).toBe(true);
  expect(r.headers()["location"]).toContain("/mis-cursos");
  await ctx.close();
});

test("un material de otro curso no se abre con la ruta de este: 404", async ({ browser, baseURL }, info) => {
  escritorio(info);
  const ctx = await conSesion(browser, baseURL, D.alumno.x.token); // X está inscrito en A y en B
  const r = await ctx.request.get(ruta(D.A.curso, D.mat.b1.id), { maxRedirects: 0 });
  expect(r.status()).toBe(404);
  await ctx.close();
});

test("lección aún no liberada: sus materiales dan 404; los de la liberada y del módulo se abren", async ({ browser, baseURL }, info) => {
  escritorio(info);
  const ctx = await conSesion(browser, baseURL, D.alumno.x.token);
  const get = (m: { id: string }) => ctx.request.get(ruta(D.B.curso, m.id), { maxRedirects: 0 });
  expect((await get(D.mat.b2)).status(), "lección 2 sin liberar").toBe(404);
  expect((await get(D.mat.b1)).status(), "lección 1 liberada").toBe(302);
  expect((await get(D.mat.bMod)).status(), "material de módulo con una lección liberada").toBe(302);

  // Si el curso aún no empieza, nada está liberado: tampoco el material del módulo.
  await rest("cursos", { method: "PATCH", query: `tenant_id=eq.${D.tenantId}&id=eq.${D.B.curso}`, body: { fecha_inicio: fechaEn(30), fecha_termino: fechaEn(90) } });
  try {
    expect((await get(D.mat.b1)).status(), "curso que aún no empieza: lección 1").toBe(404);
    expect((await get(D.mat.bMod)).status(), "curso que aún no empieza: módulo").toBe(404);
  } finally {
    await rest("cursos", { method: "PATCH", query: `tenant_id=eq.${D.tenantId}&id=eq.${D.B.curso}`, body: { fecha_inicio: fechaEn(-2), fecha_termino: fechaEn(60) } });
  }
  await ctx.close();
});

test("la lección muestra descripción, duración y materiales sin exponer la ruta del bucket", async ({ browser, baseURL }, info) => {
  escritorio(info);
  const ctx = await conSesion(browser, baseURL, D.alumno.x.token);
  const page = await ctx.newPage();
  await page.goto(`/aprender/${D.A.curso}/${D.A.lec1}`);
  await expect(page.getByRole("heading", { name: "Materiales de esta lección" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Materiales del módulo" })).toBeVisible();
  await expect(page.getByText("Qué se aprende en A1")).toBeVisible();
  await expect(page.locator(".al-meta").first()).toContainText("8 min");
  await expect(page.getByText("PDF · 193 B").first()).toBeVisible();
  await expect(page.getByText("Enlace externo")).toBeVisible();
  await expect(page.getByText("Lee la sección 2")).toBeVisible();

  const archivo = page.getByRole("link", { name: /Guía de la lección A1/ });
  await expect(archivo).toHaveAttribute("href", ruta(D.A.curso, D.mat.a1.id));
  await expect(archivo).toHaveAttribute("rel", /noopener/);
  const externo = page.getByRole("link", { name: /Lectura externa/ });
  await expect(externo).toHaveAttribute("href", "https://ejemplo.cl/lectura");
  await expect(externo).toHaveAttribute("target", "_blank");

  const html = await page.content();
  expect(html).not.toContain(D.mat.a1.ruta);
  // El id del tenant es público (TenantProvider); lo que no puede salir es la ruta del archivo.
  expect(html).not.toContain(`${D.tenantId}/${D.A.curso}`);
  expect(html).not.toContain("storage_path");
  await ctx.close();
});

test("una lección sin liberar no muestra materiales", async ({ browser, baseURL }, info) => {
  escritorio(info);
  const ctx = await conSesion(browser, baseURL, D.alumno.x.token);
  const page = await ctx.newPage();
  await page.goto(`/aprender/${D.B.curso}/${D.B.lec2}`);
  await expect(page.getByRole("status")).toContainText("Esta lección se abre el");
  await expect(page.getByRole("heading", { name: /Materiales/ })).toHaveCount(0);
  expect(await page.content()).not.toContain("Material de B2");
  await ctx.close();
});

test("página pública del curso: muestra la presentación del módulo y NO los materiales", async ({ browser, baseURL }, info) => {
  escritorio(info);
  const ctx = await conSesion(browser, baseURL);
  const page = await ctx.newPage();
  await page.goto(`/curso/${D.A.slug}`);
  await expect(page.getByText("Descripción del módulo de prueba.")).toBeVisible();
  await expect(page.getByText("Qué aprenderás")).toBeVisible();
  await expect(page.getByText("Aprender A")).toBeVisible();
  await expect(page.getByText("Duración aproximada: 20 min")).toBeVisible();
  const html = await page.content();
  expect(html).not.toContain("Guía de la lección A1");
  expect(html).not.toContain("Plantilla del módulo A");
  expect(html).not.toContain("/material/");
  await ctx.close();
});

// ---- Archivo propio en lecciones de tipo documento (ADR 030) ----

const rutaLec = (curso: string, leccion: string) => `/aprender/${curso}/leccion/${leccion}/archivo`;

test("lección documento: el alumno inscrito recibe 302 a una URL firmada que entrega el PDF", async ({ browser, baseURL }, info) => {
  escritorio(info);
  test.skip(!D.hayLeccionArchivo, "la migración 0018 no está aplicada en esta base");
  const ctx = await conSesion(browser, baseURL, D.alumno.x.token);
  const r = await ctx.request.get(rutaLec(D.A.curso, D.A.lecDoc.id), { maxRedirects: 0 });
  const loc = r.headers()["location"] ?? "";
  expect(r.status()).toBe(302);
  expect(loc).toContain("/storage/v1/object/sign/materiales/");
  expect(r.headers()["cache-control"]).toContain("no-store");
  const archivo = await fetch(loc);
  expect(archivo.status).toBe(200);
  expect(archivo.headers.get("content-type")).toContain("pdf");
  expect((await archivo.arrayBuffer()).byteLength).toBe(PDF_PRUEBA.length);
  expect((await fetch(urlPublica(D.A.lecDoc.ruta))).status).toBeGreaterThanOrEqual(400);
  await ctx.close();
});

test("lección documento: sin sesión, sin inscripción, inscripción cancelada e ids inválidos no obtienen el archivo", async ({ browser, baseURL }, info) => {
  escritorio(info);
  test.skip(!D.hayLeccionArchivo, "la migración 0018 no está aplicada en esta base");
  const sin = await conSesion(browser, baseURL);
  const r1 = await sin.request.get(rutaLec(D.A.curso, D.A.lecDoc.id), { maxRedirects: 0 });
  expect(redirige(r1.status())).toBe(true);
  expect(r1.headers()["location"]).toContain("/ingresar");
  await sin.close();

  const y = await conSesion(browser, baseURL, D.alumno.y.token); // Y no está inscrito en B
  const r2 = await y.request.get(rutaLec(D.B.curso, D.B.lecDoc.id), { maxRedirects: 0 });
  expect(redirige(r2.status())).toBe(true);
  expect(r2.headers()["location"]).toContain("/mis-cursos");
  await y.close();

  const z = await conSesion(browser, baseURL, D.alumno.z.token);
  const r3 = await z.request.get(rutaLec(D.A.curso, D.A.lecDoc.id), { maxRedirects: 0 });
  expect(redirige(r3.status())).toBe(true);
  expect(r3.headers()["location"]).toContain("/mis-cursos");
  await z.close();

  const x = await conSesion(browser, baseURL, D.alumno.x.token);
  for (const [curso, lec] of [
    [D.A.curso, "no-es-un-uuid"],
    ["no-es-un-uuid", D.A.lecDoc.id],
    [D.A.curso, "00000000-0000-0000-0000-000000000000"],
  ]) {
    expect((await x.request.get(rutaLec(curso, lec), { maxRedirects: 0 })).status(), `${curso} / ${lec}`).toBe(404);
  }
  await x.close();
});

test("lección documento: de otro curso, sin archivo o sin liberar da 404", async ({ browser, baseURL }, info) => {
  escritorio(info);
  test.skip(!D.hayLeccionArchivo, "la migración 0018 no está aplicada en esta base");
  const ctx = await conSesion(browser, baseURL, D.alumno.x.token); // X está inscrito en A y B
  const get = (curso: string, lec: string) => ctx.request.get(rutaLec(curso, lec), { maxRedirects: 0 });
  expect((await get(D.A.curso, D.B.lecDoc.id)).status(), "lección de otro curso").toBe(404);
  expect((await get(D.A.curso, D.A.lec1)).status(), "lección de texto, sin archivo").toBe(404);
  expect((await get(D.B.curso, D.B.lecDoc.id)).status(), "lección aún no liberada").toBe(404);
  await ctx.close();
});

test("lección documento: el alumno ve «Abrir documento» y la página no expone la ruta del bucket", async ({ browser, baseURL }, info) => {
  escritorio(info);
  test.skip(!D.hayLeccionArchivo, "la migración 0018 no está aplicada en esta base");
  const ctx = await conSesion(browser, baseURL, D.alumno.x.token);
  const page = await ctx.newPage();
  await page.goto(`/aprender/${D.A.curso}/${D.A.lecDoc.id}`);
  const enlace = page.getByRole("link", { name: "Abrir documento" });
  await expect(enlace).toHaveAttribute("href", rutaLec(D.A.curso, D.A.lecDoc.id));
  await expect(enlace).toHaveAttribute("rel", /noopener/);
  await expect(page.getByText(/Documento\.pdf · PDF · 193 B/)).toBeVisible();
  const html = await page.content();
  expect(html).not.toContain(D.A.lecDoc.ruta);
  expect(html).not.toContain(`${D.tenantId}/${D.A.curso}`);
  expect(html).not.toContain("storage_path");
  await ctx.close();
});

test("lección documento: la página pública del curso no enlaza el archivo", async ({ browser, baseURL }, info) => {
  escritorio(info);
  test.skip(!D.hayLeccionArchivo, "la migración 0018 no está aplicada en esta base");
  const ctx = await conSesion(browser, baseURL);
  const page = await ctx.newPage();
  await page.goto(`/curso/${D.A.slug}`);
  const html = await page.content();
  expect(html).not.toContain("/archivo");
  expect(html).not.toContain(D.A.lecDoc.ruta);
  await ctx.close();
});

test("móvil y escritorio: la lección con materiales no desborda horizontalmente", async ({ browser, baseURL, viewport }) => {
  const ctx = await conSesion(browser, baseURL, D.alumno.x.token, viewport);
  const page = await ctx.newPage();
  await page.goto(`/aprender/${D.A.curso}/${D.A.lec1}`);
  await expect(page.getByRole("heading", { name: "Materiales de esta lección" })).toBeVisible();
  const { scroll, ancho } = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, ancho: document.documentElement.clientWidth }));
  expect(scroll, "no debe haber scroll horizontal").toBeLessThanOrEqual(ancho);
  await ctx.close();
});

test("la URL firmada caduca en 60 s", async ({ browser, baseURL }, info) => {
  escritorio(info);
  test.skip(!process.env.E2E_LENTO, "tarda 65 s: se activa con E2E_LENTO=1");
  test.setTimeout(120_000);
  const ctx = await conSesion(browser, baseURL, D.alumno.x.token);
  const r = await ctx.request.get(ruta(D.A.curso, D.mat.a1.id), { maxRedirects: 0 });
  const loc = r.headers()["location"];
  expect((await fetch(loc)).status).toBe(200);
  await new Promise((ok) => setTimeout(ok, 65_000));
  expect((await fetch(loc)).status).toBeGreaterThanOrEqual(400);
  await ctx.close();
});

// ============================ 2. Creador (solo local, modo demo) ============================

test.describe("creador: archivos desde el editor", () => {
  test.skip(() => !CREADOR_LOCAL, "requiere el panel local en modo demo con ALLOW_DEMO_TENANT=true y DEMO_TENANT_SLUG igual a E2E_TENANT");

  let mod = { id: "", lec: "" };
  const urlModulo = () => `${PANEL}/cursos/${D.A.curso}/modulos/${mod.id}`;

  test.beforeAll(async () => {
    const m = await rest("modulos", { method: "POST", body: { tenant_id: D.tenantId, curso_id: D.A.curso, titulo: "Módulo del creador", orden: 5 } });
    mod.id = m.data[0].id;
    const l = await rest("lecciones", { method: "POST", body: { tenant_id: D.tenantId, curso_id: D.A.curso, modulo_id: mod.id, titulo: "Lección del creador", tipo: "texto", contenido_texto: "x", orden: 1 } });
    mod.lec = l.data[0].id;
  });

  test("sube un PDF desde el editor y queda en la base y en el bucket", async ({ page }, info) => {
    escritorio(info);
    await page.goto(urlModulo());
    await page.locator(".ed-lec__toggle").first().click();
    await page.locator(".ed-lec__mats").getByRole("button", { name: "+ Agregar material" }).click();
    await page.locator("input[id^=mat-titulo-]").first().fill("Subido por el creador");
    await page.getByRole("radio", { name: "Subir archivo" }).first().check();
    await page.locator("input[type=file]").first().setInputFiles({ name: "creador.pdf", mimeType: "application/pdf", buffer: PDF_PRUEBA });
    await expect(page.locator(".mt-archivo__info strong")).toHaveText("creador.pdf", { timeout: 30_000 });

    const filas = await rest("materiales", { query: `select=id,origen,url,storage_path,bytes,archivo_nombre,leccion_id&tenant_id=eq.${D.tenantId}&modulo_id=eq.${mod.id}` });
    expect(filas.data).toHaveLength(1);
    const f = filas.data[0];
    expect(f).toMatchObject({ origen: "archivo", url: null, bytes: PDF_PRUEBA.length, archivo_nombre: "creador.pdf", leccion_id: mod.lec });
    expect(f.storage_path).toMatch(new RegExp(`^${D.tenantId}/${D.A.curso}/[0-9a-f-]{36}\\.pdf$`));
    rutas.push(f.storage_path);
    expect(await existeObjeto(f.storage_path)).toBe(true);
  });

  test("rechaza un tipo de archivo no permitido sin subir nada", async ({ page }, info) => {
    escritorio(info);
    await page.goto(urlModulo());
    await page.locator(".ed-lec__toggle").first().click();
    await page.locator(".ed-lec__mats").getByRole("button", { name: "+ Agregar material" }).click();
    await page.getByRole("radio", { name: "Subir archivo" }).last().check();
    await page.locator("input[type=file]").last().setInputFiles({ name: "malo.exe", mimeType: "application/octet-stream", buffer: Buffer.from("MZ") });
    await expect(page.getByRole("alert").filter({ hasText: "no está permitido" })).toBeVisible();
    const antes = await listarObjetos(`${D.tenantId}/${D.A.curso}`);
    expect(antes.some((n) => n.endsWith(".exe"))).toBe(false);
  });

  test("borrar el material elimina su objeto del bucket", async ({ page }, info) => {
    escritorio(info);
    const [f] = (await rest("materiales", { query: `select=id,storage_path&tenant_id=eq.${D.tenantId}&modulo_id=eq.${mod.id}&origen=eq.archivo` })).data;
    expect(await existeObjeto(f.storage_path)).toBe(true);
    await page.goto(urlModulo());
    await page.locator(".ed-lec__toggle").first().click();
    await page.getByRole("button", { name: /^Eliminar material Subido por el creador/ }).click();
    await page.getByRole("button", { name: "Eliminar", exact: true }).last().click();
    await expect.poll(async () => (await rest("materiales", { query: `select=id&id=eq.${f.id}` })).data.length, { timeout: 15_000 }).toBe(0);
    await expect.poll(() => existeObjeto(f.storage_path), { timeout: 15_000 }).toBe(false);
  });

  test("borrar una lección elimina los objetos de sus materiales", async ({ page }, info) => {
    escritorio(info);
    const l = await rest("lecciones", { method: "POST", body: { tenant_id: D.tenantId, curso_id: D.A.curso, modulo_id: mod.id, titulo: "Lección a borrar", tipo: "texto", contenido_texto: "x", orden: 9 } });
    const m = await crearMaterialArchivo(D.A.curso, mod.id, l.data[0].id, "Material de la lección a borrar", 9);
    expect(await existeObjeto(m.ruta)).toBe(true);
    await page.goto(urlModulo());
    await page.getByRole("button", { name: "Eliminar lección Lección a borrar" }).click();
    await page.getByRole("button", { name: "Eliminar", exact: true }).last().click();
    await expect.poll(async () => (await rest("materiales", { query: `select=id&id=eq.${m.id}` })).data.length, { timeout: 15_000 }).toBe(0);
    await expect.poll(() => existeObjeto(m.ruta), { timeout: 15_000 }).toBe(false);
  });

  test("borrar un módulo elimina los objetos de sus materiales", async ({ page }, info) => {
    escritorio(info);
    const mm = await rest("modulos", { method: "POST", body: { tenant_id: D.tenantId, curso_id: D.A.curso, titulo: "Módulo a borrar", orden: 8 } });
    const m = await crearMaterialArchivo(D.A.curso, mm.data[0].id, null, "Material del módulo a borrar", 0);
    expect(await existeObjeto(m.ruta)).toBe(true);
    await page.goto(`${PANEL}/cursos/${D.A.curso}/editar?paso=estructura`);
    await page.getByRole("button", { name: "Eliminar módulo Módulo a borrar" }).click();
    await page.getByRole("button", { name: "Eliminar", exact: true }).last().click();
    await expect.poll(async () => (await rest("modulos", { query: `select=id&id=eq.${mm.data[0].id}` })).data.length, { timeout: 15_000 }).toBe(0);
    await expect.poll(() => existeObjeto(m.ruta), { timeout: 15_000 }).toBe(false);
  });

  test("sube un archivo a una lección de tipo documento desde el editor", async ({ page }, info) => {
    escritorio(info);
    test.skip(!D.hayLeccionArchivo, "la migración 0018 no está aplicada en esta base");
    const l = await rest("lecciones", { method: "POST", body: { tenant_id: D.tenantId, curso_id: D.A.curso, modulo_id: mod.id, titulo: "Documento del creador", tipo: "documento", orden: 20 } });
    const id = l.data[0].id as string;
    await page.goto(urlModulo());
    const lec = page.locator(".ed-lec", { hasText: "Documento del creador" });
    await lec.locator(".ed-lec__toggle").click();
    await lec.getByRole("radio", { name: "Subir archivo" }).first().check();
    await lec.locator("input[type=file]").first().setInputFiles({ name: "doc.pdf", mimeType: "application/pdf", buffer: PDF_PRUEBA });
    await expect(lec.locator(".mt-archivo__info strong").first()).toHaveText("doc.pdf", { timeout: 30_000 });

    const [f] = (await rest("lecciones", { query: `select=tipo,contenido_url,storage_path,archivo_nombre,bytes,contenido_tipo&id=eq.${id}` })).data;
    expect(f).toMatchObject({ tipo: "documento", contenido_url: null, archivo_nombre: "doc.pdf", bytes: PDF_PRUEBA.length, contenido_tipo: "application/pdf" });
    expect(f.storage_path).toMatch(new RegExp(`^${D.tenantId}/${D.A.curso}/[0-9a-f-]{36}\\.pdf$`));
    rutas.push(f.storage_path);
    expect(await existeObjeto(f.storage_path)).toBe(true);

    // Quitar el archivo lo elimina del bucket y deja la lección sin contenido.
    await lec.getByRole("button", { name: "Quitar archivo" }).click();
    await page.getByRole("button", { name: "Quitar archivo" }).last().click();
    await expect.poll(async () => (await rest("lecciones", { query: `select=storage_path&id=eq.${id}` })).data[0].storage_path, { timeout: 15_000 }).toBeNull();
    await expect.poll(() => existeObjeto(f.storage_path), { timeout: 15_000 }).toBe(false);
    const [despues] = (await rest("lecciones", { query: `select=tipo,archivo_nombre,bytes&id=eq.${id}` })).data;
    expect(despues).toEqual({ tipo: "documento", archivo_nombre: null, bytes: null });
  });

  test("cambiar el formato de una lección con archivo lo elimina del bucket", async ({ page }, info) => {
    escritorio(info);
    test.skip(!D.hayLeccionArchivo, "la migración 0018 no está aplicada en esta base");
    const l = await crearLeccionDocumento(D.A.curso, mod.id, "Documento a cambiar de formato", 21);
    await page.goto(urlModulo());
    const lec = page.locator(".ed-lec", { hasText: "Documento a cambiar de formato" });
    await lec.locator(".ed-lec__toggle").click();
    expect(await existeObjeto(l.ruta)).toBe(true);
    await lec.getByRole("radio", { name: "Texto", exact: true }).check();
    await lec.getByRole("button", { name: "Guardar cambios" }).click();
    await page.getByRole("button", { name: "Guardar y descartar" }).click();
    await expect.poll(async () => (await rest("lecciones", { query: `select=tipo,storage_path&id=eq.${l.id}` })).data[0], { timeout: 15_000 }).toEqual({ tipo: "texto", storage_path: null });
    await expect.poll(() => existeObjeto(l.ruta), { timeout: 15_000 }).toBe(false);
  });

  test("borrar una lección de tipo documento elimina su archivo", async ({ page }, info) => {
    escritorio(info);
    test.skip(!D.hayLeccionArchivo, "la migración 0018 no está aplicada en esta base");
    const l = await crearLeccionDocumento(D.A.curso, mod.id, "Documento a borrar", 22);
    expect(await existeObjeto(l.ruta)).toBe(true);
    await page.goto(urlModulo());
    await page.getByRole("button", { name: "Eliminar lección Documento a borrar" }).click();
    await page.getByRole("button", { name: "Eliminar", exact: true }).last().click();
    await expect.poll(async () => (await rest("lecciones", { query: `select=id&id=eq.${l.id}` })).data.length, { timeout: 15_000 }).toBe(0);
    await expect.poll(() => existeObjeto(l.ruta), { timeout: 15_000 }).toBe(false);
  });

  test("borrar un módulo con una lección de tipo documento elimina su archivo", async ({ page }, info) => {
    escritorio(info);
    test.skip(!D.hayLeccionArchivo, "la migración 0018 no está aplicada en esta base");
    const mm = await rest("modulos", { method: "POST", body: { tenant_id: D.tenantId, curso_id: D.A.curso, titulo: "Módulo con documento a borrar", orden: 9 } });
    const l = await crearLeccionDocumento(D.A.curso, mm.data[0].id, "Documento del módulo a borrar", 0);
    expect(await existeObjeto(l.ruta)).toBe(true);
    await page.goto(`${PANEL}/cursos/${D.A.curso}/editar?paso=estructura`);
    await page.getByRole("button", { name: "Eliminar módulo Módulo con documento a borrar" }).click();
    await page.getByRole("button", { name: "Eliminar", exact: true }).last().click();
    await expect.poll(async () => (await rest("modulos", { query: `select=id&id=eq.${mm.data[0].id}` })).data.length, { timeout: 15_000 }).toBe(0);
    await expect.poll(() => existeObjeto(l.ruta), { timeout: 15_000 }).toBe(false);
  });
});
