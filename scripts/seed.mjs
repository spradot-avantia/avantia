// Siembra datos de prueba en Supabase para poder probar las páginas del MVP
// sin esperar a tener datos reales de un cliente. Sin dependencias nuevas:
// usa fetch nativo de Node 20 contra la REST API de Supabase (PostgREST) con
// la service role key, igual que hace apps/web/src/lib/supabase/admin.ts.
//
// Uso: npm run db:seed
// Requiere NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el
// entorno, o en apps/web/.env.local.

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function loadEnvLocal() {
  const envPath = path.join(rootDir, "apps", "web", ".env.local");
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvLocal();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Definilas en el entorno o en apps/web/.env.local antes de correr `npm run db:seed`."
  );
  process.exit(1);
}

async function supabaseRequest(pathname, { method = "GET", body, onConflict } = {}) {
  const url = new URL(`/rest/v1/${pathname}`, supabaseUrl);
  if (onConflict) url.searchParams.set("on_conflict", onConflict);

  const res = await fetch(url, {
    method,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: body ? "resolution=merge-duplicates,return=representation" : "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Supabase ${method} ${pathname} -> ${res.status}: ${detail}`);
  }

  return res.json();
}

const TENANTS = [
  {
    slug: "academia-de-juan",
    subdomain: "juan",
    nombre: "Academia de Juan",
    color_primario: "#2563eb",
    frase: "Música para principiantes",
    area: "Música",
    cursos: [
      {
        slug: "guitarra-desde-cero",
        titulo: "Guitarra desde cero",
        descripcion: "Aprendé a tocar guitarra en 8 semanas, sin experiencia previa.",
        precio_centavos: 4999_00,
        estado: "publicado",
        modalidad: "a_su_ritmo",
        acceso: "enlace",
        objetivos: ["Tocar tus primeras 5 canciones", "Leer tablaturas básicas"],
        modulos: [
          {
            titulo: "Primeros pasos",
            lecciones: [
              { titulo: "Cómo sostener la guitarra", tipo: "video", contenido_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
              { titulo: "Tus primeros acordes", tipo: "texto", contenido_texto: "Empieza con Mi menor y La menor." },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "academia-de-maria",
    subdomain: "maria",
    nombre: "Academia de María",
    color_primario: "#16a34a",
    cursos: [
      {
        slug: "excel-para-negocios",
        titulo: "Excel para negocios",
        descripcion: "Fórmulas, tablas dinámicas y dashboards para tu negocio.",
        precio_centavos: 3499_00,
      },
      {
        slug: "finanzas-personales",
        titulo: "Finanzas personales",
        descripcion: "Organizá tus gastos e inversiones con un plan simple.",
        precio_centavos: 2999_00,
      },
    ],
  },
];

for (const { cursos, ...tenantData } of TENANTS) {
  const [tenant] = await supabaseRequest("tenants", {
    method: "POST",
    body: tenantData,
    onConflict: "subdomain",
  });

  console.log(`Tenant listo: ${tenant.nombre} (${tenant.subdomain})`);

  for (const curso of cursos) {
    const { objetivos = [], modulos = [], ...cursoData } = curso;
    const [cursoRow] = await supabaseRequest("cursos", {
      method: "POST",
      body: { ...cursoData, tenant_id: tenant.id },
      onConflict: "tenant_id,slug",
    });
    console.log(`  Curso listo: ${curso.titulo}`);

    // Objetivos, modulos y lecciones (migracion 0001). Idempotente: objetivos
    // por (curso_id, orden); modulos/lecciones solo si el curso aun no tiene.
    if (objetivos.length) {
      await supabaseRequest("curso_objetivos", {
        method: "POST",
        body: objetivos.map((texto, i) => ({
          tenant_id: tenant.id,
          curso_id: cursoRow.id,
          orden: i + 1,
          texto,
        })),
        onConflict: "curso_id,orden",
      });
    }
    const existentes = modulos.length
      ? await supabaseRequest(`modulos?select=id&curso_id=eq.${cursoRow.id}&limit=1`)
      : [];
    if (modulos.length && existentes.length === 0) {
      for (const [mi, { lecciones = [], ...modulo }] of modulos.entries()) {
        const [mod] = await supabaseRequest("modulos", {
          method: "POST",
          body: { ...modulo, orden: mi, tenant_id: tenant.id, curso_id: cursoRow.id },
        });
        if (lecciones.length) {
          await supabaseRequest("lecciones", {
            method: "POST",
            body: lecciones.map((l, li) => ({
              ...l,
              orden: li,
              tenant_id: tenant.id,
              curso_id: cursoRow.id,
              modulo_id: mod.id,
            })),
          });
        }
      }
    }
  }
}

console.log("\nListo. Sugerencia: DEMO_TENANT_SLUG=juan en apps/web/.env.local");
