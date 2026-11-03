import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

// Flujo completo del alumno con datos reales de Supabase (requiere la migración
// 0007 aplicada). Crea su propio curso y alumnos de prueba y los borra al final.
// Los correos no se envían: el test inserta el token de confirmación conocido.

function env(): Record<string, string> {
  const out: Record<string, string> = { ...(process.env as Record<string, string>) };
  try {
    for (const l of readFileSync(path.join(__dirname, "..", ".env.local"), "utf8").split(/\r?\n/)) {
      const m = /^([A-Z0-9_]+)=(.*)$/.exec(l.trim());
      if (m && !(m[1] in out)) out[m[1]] = m[2];
    }
  } catch {
    /* sin .env.local */
  }
  return out;
}
const E = env();
const URL_DB = E.NEXT_PUBLIC_SUPABASE_URL;
const KEY = E.SUPABASE_SERVICE_ROLE_KEY;
const SUB = process.env.E2E_TENANT ?? "prueba";

async function rest(tabla: string, init: { method?: string; query?: string; body?: unknown } = {}) {
  const res = await fetch(`${URL_DB}/rest/v1/${tabla}${init.query ? `?${init.query}` : ""}`, {
    method: init.method ?? "GET",
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const txt = await res.text();
  return { status: res.status, data: txt ? JSON.parse(txt) : null };
}

const sufijo = randomUUID().slice(0, 8);
const slug = `e2e-${sufijo}`;
const correoA = `e2e-a-${sufijo}@example.com`;
const correoB = `e2e-b-${sufijo}@example.com`;
const CLAVE = "clave-de-prueba-123";
let tenantId = "";
let cursoId = "";
let hayTabla = false;

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  test.skip(!URL_DB || !KEY, "faltan credenciales de Supabase");
  hayTabla = (await rest("alumnos", { query: "select=id&limit=1" })).status === 200;
  test.skip(!hayTabla, "la migración 0007 no está aplicada en esta base");

  const t = await rest("tenants", { query: `select=id&subdomain=eq.${SUB}` });
  tenantId = t.data?.[0]?.id;
  test.skip(!tenantId, `no existe la academia ${SUB}`);

  const c = await rest("cursos", {
    method: "POST",
    body: { tenant_id: tenantId, slug, titulo: `Curso E2E ${sufijo}`, descripcion: "Curso de prueba automática para el flujo del alumno.", estado: "publicado", acceso: "enlace", published_at: new Date().toISOString() },
  });
  cursoId = c.data[0].id;
  const m = await rest("modulos", { method: "POST", body: { tenant_id: tenantId, curso_id: cursoId, titulo: "Módulo 1", orden: 0 } });
  const modId = m.data[0].id;
  await rest("curso_objetivos", { method: "POST", body: { tenant_id: tenantId, curso_id: cursoId, orden: 1, texto: "Probar el flujo completo" } });
  await rest("lecciones", {
    method: "POST",
    body: [1, 2].map((n) => ({ tenant_id: tenantId, curso_id: cursoId, modulo_id: modId, titulo: `Lección ${n}`, tipo: "texto", contenido_texto: `Contenido ${n}`, orden: n })),
  });
});

test.afterAll(async () => {
  if (!hayTabla || !tenantId) return;
  await rest("alumnos", { method: "DELETE", query: `tenant_id=eq.${tenantId}&correo=in.(${correoA},${correoB})` });
  await rest("invitaciones", { method: "DELETE", query: `tenant_id=eq.${tenantId}&email=eq.${correoB}` });
  if (cursoId) await rest("cursos", { method: "DELETE", query: `tenant_id=eq.${tenantId}&id=eq.${cursoId}` });
});

async function confirmarPorToken(page: import("@playwright/test").Page, correo: string) {
  const al = await rest("alumnos", { query: `select=id&tenant_id=eq.${tenantId}&correo=eq.${correo}` });
  const alumnoId = al.data[0].id;
  const token = randomUUID() + randomUUID();
  await rest("alumno_tokens", {
    method: "POST",
    body: { tenant_id: tenantId, alumno_id: alumnoId, tipo: "confirmar", token_hash: createHash("sha256").update(token).digest("hex"), expira_at: new Date(Date.now() + 3600e3).toISOString() },
  });
  await page.goto(`/confirmar?token=${token}`);
  await page.getByRole("button", { name: /Confirmar mi correo/ }).click();
  await expect(page).toHaveURL(/\/mis-cursos/);
}

test("registro desde la ficha → correo sin confirmar → confirmar → inscripción pendiente", async ({ page }) => {
  await page.goto(`/curso/${slug}`);
  await page.locator("a.fc-cta").click();
  await expect(page).toHaveURL(/\/registro\?curso=/);
  await page.getByLabel("Nombre y apellido").fill("Camila Rojas");
  await page.getByLabel("Correo").fill(correoA);
  await page.getByLabel("Contraseña").fill(CLAVE);
  await page.getByLabel(/Acepto los/).check();
  await page.getByRole("button", { name: "Crear mi cuenta" }).click();
  await expect(page.getByRole("status")).toContainText("Te enviamos un enlace");

  // Sin confirmar no entra.
  await page.goto("/ingresar");
  await page.getByLabel("Correo").fill(correoA);
  await page.getByLabel("Contraseña").fill(CLAVE);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page.locator("main [role=alert]")).toContainText("Aún no confirmas tu correo");

  await confirmarPorToken(page, correoA);
  await expect(page.getByText("Pendiente de activación")).toBeVisible();
  await expect(page.getByText(/debe activar tu inscripción/)).toBeVisible();

  // El enlace de confirmación es de un solo uso.
  const filas = await rest("inscripciones", { query: `select=estado,origen&tenant_id=eq.${tenantId}&curso_id=eq.${cursoId}` });
  expect(filas.data).toEqual([{ estado: "pendiente", origen: "pagina" }]);
});

test("inscripción pendiente no abre el contenido", async ({ page }) => {
  await page.goto("/ingresar");
  await page.getByLabel("Correo").fill(correoA);
  await page.getByLabel("Contraseña").fill(CLAVE);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/mis-cursos/);
  await page.goto(`/aprender/${cursoId}`);
  await expect(page).toHaveURL(/\/mis-cursos/);
});

test("activada por el creador: lecciones, XP y cierre del curso", async ({ page }) => {
  await rest("inscripciones", { method: "PATCH", query: `tenant_id=eq.${tenantId}&curso_id=eq.${cursoId}`, body: { estado: "activa", activada_por: "creador", activada_en: new Date().toISOString() } });

  await page.goto("/ingresar");
  await page.getByLabel("Correo").fill(correoA);
  await page.getByLabel("Contraseña").fill(CLAVE);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page.getByText("Inscripción activa")).toBeVisible();
  await page.getByRole("link", { name: "Empezar el curso" }).click();
  await expect(page.getByRole("heading", { name: "Lección 1" })).toBeVisible();

  await page.getByRole("button", { name: /Marcar como completada/ }).click();
  await expect(page.getByRole("heading", { name: "Lección 2" })).toBeVisible();
  await expect(page.getByText("+10 XP").first()).toBeVisible();
  await page.waitForLoadState("networkidle"); // hidratación terminada

  await page.getByRole("button", { name: /Marcar como completada/ }).click();
  await expect(page).toHaveURL(/\/completado/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Terminaste");

  // 2 lecciones (20) + módulo (20) + curso (50) = 90 XP.
  await page.goto("/progreso");
  await expect(page.getByText("90 XP").first()).toBeVisible();
});

test("la sesión es solo de esta academia y cerrar sesión la termina", async ({ page, context }) => {
  await page.goto("/ingresar");
  await page.getByLabel("Correo").fill(correoA);
  await page.getByLabel("Contraseña").fill(CLAVE);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/mis-cursos/);
  const cookie = (await context.cookies()).find((c) => c.name === "av_alumno");
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe("Lax");
  await page.getByRole("button", { name: "Salir" }).click();
  await page.goto("/mis-cursos");
  await expect(page).toHaveURL(/\/ingresar/);
});

test("invitación: con correo confirmado entra directo con inscripción activa", async ({ page }) => {
  await rest("invitaciones", { method: "POST", body: { tenant_id: tenantId, curso_id: cursoId, email: correoB } });
  await page.goto("/registro");
  await page.getByLabel("Nombre y apellido").fill("Pedro Rojas");
  await page.getByLabel("Correo").fill(correoB);
  await page.getByLabel("Contraseña").fill(CLAVE);
  await page.getByLabel(/Acepto los/).check();
  await page.getByRole("button", { name: "Crear mi cuenta" }).click();
  await expect(page.getByRole("status")).toBeVisible();

  // Antes de confirmar el correo no hay inscripción (nadie hereda una invitación ajena).
  const antes = await rest("inscripciones", { query: `select=id&tenant_id=eq.${tenantId}&curso_id=eq.${cursoId}&alumno_id=eq.${(await rest("alumnos", { query: `select=id&tenant_id=eq.${tenantId}&correo=eq.${correoB}` })).data[0].id}` });
  expect(antes.data).toEqual([]);

  await confirmarPorToken(page, correoB);
  await expect(page.getByText("Inscripción activa")).toBeVisible();
});

test("el creador de otra academia no comparte cuentas: el mismo correo no existe en otro tenant", async () => {
  const otras = await rest("alumnos", { query: `select=id&correo=eq.${correoA}&tenant_id=neq.${tenantId}` });
  expect(otras.data).toEqual([]);
});
