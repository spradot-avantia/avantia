#!/usr/bin/env node
// Falla si algo fuera de la lista blanca importa lib/supabase/admin (service
// role, salta RLS). Ejecutar desde la raiz: node scripts/check-admin-imports.mjs
//
// LISTA BLANCA (cada entrada debe justificarse; para agregar una, revisa que el
// archivo filtre por tenant_id / no sea codigo de cliente y anotalo aqui):
//   - lib/tenant/resolve.ts            resolver host -> tenant (cruza tenants por diseno)
//   - app/api/tenants/resolve/route.ts resolucion de host para el middleware
//   - app/api/tenants/domain/route.ts  alta de dominio propio (filtra por tenant)
//   - app/(public)/[domain]/curso/[slug]/page.tsx  sitio publico del tenant (filtra por tenant_id)
//   - app/(dashboard)/admin/page.tsx   panel interno de Avantia
//   - lib/creador/tenantActual.ts      SOLO rama DEMO provisional (RQ-01); se elimina con el login real
// Prohibido: Server Actions de alta/auth (lib/creador/actionsAlta.ts, lib/auth/**)
// y cualquier archivo "use client".
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const RAIZ = join(process.cwd(), "apps", "web", "src");
const BASE = "apps/web/src/";
const LISTA_BLANCA = new Set([
  "lib/tenant/resolve.ts",
  "app/api/tenants/resolve/route.ts",
  "app/api/tenants/domain/route.ts",
  "app/(public)/[domain]/curso/[slug]/page.tsx",
  "app/(dashboard)/admin/page.tsx",
  "lib/creador/tenantActual.ts",
  "lib/supabase/admin.ts",
]);
const PATRON = /(?:from\s*|import\s*\(\s*|require\s*\(\s*|import\s+)["'][^"']*supabase\/admin(?:\.[tj]sx?)?["']/;

function* archivos(dir) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) {
      if (n === "node_modules" || n === ".next") continue;
      yield* archivos(p);
    } else if (/\.(ts|tsx|js|jsx|mjs)$/.test(n)) yield p;
  }
}

const malos = [];
for (const f of archivos(RAIZ)) {
  const rel = relative(RAIZ, f).split(sep).join("/");
  const txt = readFileSync(f, "utf8");
  if (!PATRON.test(txt)) continue;
  const cliente = /^\s*["']use client["']/m.test(txt.slice(0, 200));
  if (cliente || !LISTA_BLANCA.has(rel)) malos.push({ rel, cliente });
}

if (malos.length) {
  console.error("lib/supabase/admin importado fuera de la lista blanca:");
  for (const m of malos) console.error(`  - ${BASE}${m.rel}${m.cliente ? " (use client)" : ""}`);
  console.error("Usa lib/supabase/server (sesion + RLS) o justifica y agrega el archivo a la lista blanca de scripts/check-admin-imports.mjs.");
  process.exit(1);
}
console.log("OK: imports de lib/supabase/admin dentro de la lista blanca.");
