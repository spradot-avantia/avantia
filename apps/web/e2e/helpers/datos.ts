// Ayudas para las pruebas E2E que usan datos reales de Supabase (service role).
// Cada suite crea SUS PROPIOS datos con un sufijo aleatorio y los borra al final: nunca toca
// los cursos ni los alumnos de nadie. Mismo patrón que flujo-alumno.spec.ts.
import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

export function leerEnv(): Record<string, string> {
  const out: Record<string, string> = { ...(process.env as Record<string, string>) };
  try {
    for (const l of readFileSync(path.join(__dirname, "..", "..", ".env.local"), "utf8").split(/\r?\n/)) {
      const m = /^([A-Z0-9_]+)=(.*)$/.exec(l.trim());
      if (m && !(m[1] in out)) out[m[1]] = m[2];
    }
  } catch {
    /* sin .env.local: se usan solo las variables del proceso */
  }
  return out;
}

export const E = leerEnv();
export const URL_DB = E.NEXT_PUBLIC_SUPABASE_URL;
export const KEY = E.SUPABASE_SERVICE_ROLE_KEY;
export const BUCKET = "materiales";

const cabecera = { apikey: KEY, Authorization: `Bearer ${KEY}` };

export async function rest(tabla: string, init: { method?: string; query?: string; body?: unknown } = {}) {
  const res = await fetch(`${URL_DB}/rest/v1/${tabla}${init.query ? `?${init.query}` : ""}`, {
    method: init.method ?? "GET",
    headers: { ...cabecera, "Content-Type": "application/json", Prefer: "return=representation" },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const txt = await res.text();
  return { status: res.status, data: txt ? JSON.parse(txt) : null };
}

/** PDF mínimo (193 bytes) para subir como material de prueba. */
export const PDF_PRUEBA = Buffer.from(
  "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n",
);

// ---- Storage (API REST con service role) -----------------------------------------------
export async function subirObjeto(ruta: string, contenido: Buffer = PDF_PRUEBA, mime = "application/pdf") {
  const res = await fetch(`${URL_DB}/storage/v1/object/${BUCKET}/${ruta}`, {
    method: "POST",
    headers: { ...cabecera, "Content-Type": mime, "x-upsert": "true" },
    body: new Uint8Array(contenido),
  });
  if (!res.ok) throw new Error(`No se pudo subir el objeto de prueba (${res.status}): ${await res.text()}`);
}

/** Nombres de los objetos que hay bajo un prefijo del bucket (por ejemplo `{tenant}/{curso}`). */
export async function listarObjetos(prefijo: string): Promise<string[]> {
  const res = await fetch(`${URL_DB}/storage/v1/object/list/${BUCKET}`, {
    method: "POST",
    headers: { ...cabecera, "Content-Type": "application/json" },
    body: JSON.stringify({ prefix: prefijo, limit: 200 }),
  });
  const filas = (await res.json()) as Array<{ name: string }> | { message?: string };
  return Array.isArray(filas) ? filas.map((f) => f.name) : [];
}

export async function quitarObjetos(rutas: string[]) {
  if (rutas.length === 0) return;
  await fetch(`${URL_DB}/storage/v1/object/${BUCKET}`, {
    method: "DELETE",
    headers: { ...cabecera, "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: rutas }),
  });
}

export async function existeObjeto(ruta: string): Promise<boolean> {
  const i = ruta.lastIndexOf("/");
  return (await listarObjetos(ruta.slice(0, i))).includes(ruta.slice(i + 1));
}

/** URL pública (sin firma) de un objeto: en un bucket privado NO debe entregarlo. */
export const urlPublica = (ruta: string) => `${URL_DB}/storage/v1/object/public/${BUCKET}/${ruta}`;

// ---- Sesión del alumno (ADR 018): se inserta el token y se usa como cookie --------------
export function nuevaSesion(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: createHash("sha256").update(token).digest("hex") };
}

/** Fecha YYYY-MM-DD a `dias` de hoy (negativo = pasado). */
export function fechaEn(dias: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}
