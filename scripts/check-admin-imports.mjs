#!/usr/bin/env node
// Falla si algo fuera de la lista blanca importa lib/supabase/admin (service
// role, salta RLS). Ejecutar desde la raiz: node scripts/check-admin-imports.mjs
//
// LISTA BLANCA (cada entrada debe justificarse; para agregar una, revisa que el
// archivo filtre por tenant_id / no sea codigo de cliente y anotalo aqui):
//   - lib/tenant/resolve.ts            resolver host -> tenant (cruza tenants por diseno)
//   - app/api/tenants/resolve/route.ts resolucion de host para el middleware
//   - app/api/tenants/domain/route.ts  alta de dominio propio (filtra por tenant)
//   - app/(admin)/admin/ (prefijo)     zona interna de Avantia (ADR 017): el layout exige esStaff() (deniega por
//                                      defecto) y trabaja sobre TODAS las academias por diseno. Un archivo "use client"
//                                      ahi sigue prohibido
//   - lib/admin/actions.ts             acciones de /admin: cada una verifica esStaff() por si misma (una Server Action
//                                      se puede invocar sin pasar por el layout); solo reciben ids/correos del equipo
//   - lib/staff.ts                     tabla `staff` (plataforma, sin tenant_id, cerrada a clientes; ADR 016)
//   - lib/postulacion/acceso.ts        verifica postulacion aceptada (tabla de plataforma sin tenant_id; ADR 011/014/015)
//   - lib/postulacion/actions.ts       postular (publico a proposito, ADR 014: honeypot y limites) y revisar (esStaff)
//   - app/(auth)/auth/callback/route.ts  borra la cuenta recien creada por Google si el correo no tiene invitacion (ADR 014/015)
//   - lib/sitio/paginaPublica.ts       sitio publico de la academia: solo lo publicado, filtra por tenant_id (ADR 021)
//   - lib/alumno/{sesion,cuentas,inscripciones,catalogo,progreso,eventos}.ts  cuentas y datos del alumno por academia;
//     la sesion del alumno no es de Supabase Auth, asi que no hay RLS posible: TODA query filtra por el tenant del host (ADR 018)
//   - lib/alumno/{materiales,perfil,quiz,repaso,tareas}.ts  mismo patron de alumno (ADR 018, 023, 024, 029, 038, 039):
//     sesion del alumno sin RLS posible; el tenant sale del host y cada query filtra por tenant_id (repaso: RPC con p_tenant)
//   - app/(public)/[domain]/(alumno)/perfil/page.tsx  Server Component del perfil del alumno; query filtrada por tenant.id y alumno.id
//   - lib/creador/tareas.ts            SOLO el bucket `entregas` (leer/borrar objetos), tras comprobar con RLS que la fila es de la academia (ADR 038)
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
  "app/(admin)/admin/", // prefijo: ver nota arriba
  "lib/admin/actions.ts",
  "lib/staff.ts",
  "lib/postulacion/acceso.ts",
  "lib/postulacion/actions.ts",
  "app/(auth)/auth/callback/route.ts",
  "lib/sitio/paginaPublica.ts",
  "lib/alumno/sesion.ts",
  "lib/alumno/cuentas.ts",
  "lib/alumno/inscripciones.ts",
  "lib/alumno/catalogo.ts",
  "lib/alumno/progreso.ts",
  "lib/alumno/eventos.ts",
  "lib/alumno/materiales.ts",
  "lib/alumno/perfil.ts",
  "lib/alumno/quiz.ts",
  "lib/alumno/repaso.ts",
  "lib/alumno/tareas.ts",
  "app/(public)/[domain]/(alumno)/perfil/page.tsx",
  "lib/creador/tareas.ts",
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
  const permitido = LISTA_BLANCA.has(rel) || [...LISTA_BLANCA].some((e) => e.endsWith("/") && rel.startsWith(e));
  if (cliente || !permitido) malos.push({ rel, cliente });
}

if (malos.length) {
  console.error("lib/supabase/admin importado fuera de la lista blanca:");
  for (const m of malos) console.error(`  - ${BASE}${m.rel}${m.cliente ? " (use client)" : ""}`);
  console.error("Usa lib/supabase/server (sesion + RLS) o justifica y agrega el archivo a la lista blanca de scripts/check-admin-imports.mjs.");
  process.exit(1);
}
console.log("OK: imports de lib/supabase/admin dentro de la lista blanca.");
