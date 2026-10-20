// Pruebas de aislamiento RLS con dos tenants (RQ-04, RQ-31).
// Corre contra un Postgres DESCARTABLE (nunca contra la base real):
//   docker run -d --name avantia-pg-test -e POSTGRES_PASSWORD=test -p 54329:5432 postgres:16
//   npm run test:rls
// TEST_DATABASE_URL por defecto apunta a ese contenedor. El script recrea el
// esquema "public" desde cero, emula auth/storage (db/test/bootstrap.sql) y
// aplica db/schema.sql y luego las migraciones (comprueba idempotencia).
// Limite: es Postgres plano, no Supabase; no prueba PostgREST ni Storage real.

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const url = process.env.TEST_DATABASE_URL ?? "postgres://postgres:test@localhost:54329/postgres";
if (!/localhost|127\.0\.0\.1/.test(url)) {
  console.error("Rechazado: TEST_DATABASE_URL debe ser local (el script borra el esquema public).");
  process.exit(2);
}
const read = (p) => readFileSync(path.join(root, p), "utf8");

const client = new pg.Client({ connectionString: url });
await client.connect();

let pass = 0;
const fallos = [];
function check(nombre, ok, detalle = "") {
  if (ok) { pass++; console.log(`  ok   ${nombre}`); }
  else { fallos.push(nombre); console.log(`  FAIL ${nombre} ${detalle}`); }
}

// Ejecuta fn dentro de una transaccion como rol/usuario; siempre hace rollback.
async function como(rol, uid, fn) {
  await client.query("begin");
  try {
    await client.query(`set local role ${rol}`);
    await client.query("select set_config('request.jwt.claim.sub', $1, true)", [uid ?? ""]);
    return await fn(client);
  } finally {
    await client.query("rollback");
  }
}
const cuenta = async (c, sql, params) => (await c.query(sql, params)).rows.length;
async function falla(rol, uid, sql, params) {
  try { await como(rol, uid, (c) => c.query(sql, params)); return false; } catch { return true; }
}
async function filasAfectadas(rol, uid, sql, params) {
  return como(rol, uid, async (c) => (await c.query(sql, params)).rowCount);
}

console.log("Preparando esquema...");
await client.query("drop schema if exists public cascade; drop schema if exists auth cascade; drop schema if exists storage cascade; create schema public;");
await client.query(read("db/test/bootstrap.sql"));
await client.query(read("db/schema.sql"));
for (const f of readdirSync(path.join(root, "db/migrations")).filter((f) => f.endsWith(".sql")).sort()) {
  try { await client.query(read(`db/migrations/${f}`)); console.log(`  migracion re-aplicada: ${f}`); }
  catch (e) { check(`migracion ${f} es idempotente`, false, e.message); }
}

// --- Datos: 2 academias (A, B), sus creadores, un alumno de A y uno de B ---
const U = {
  creaA: "00000000-0000-0000-0000-0000000000a1",
  creaB: "00000000-0000-0000-0000-0000000000b1",
  alumA: "00000000-0000-0000-0000-0000000000a2",
  alumB: "00000000-0000-0000-0000-0000000000b2",
  libre: "00000000-0000-0000-0000-0000000000c3", // alumno sin inscripciones
};
const T = { A: "10000000-0000-0000-0000-00000000000a", B: "10000000-0000-0000-0000-00000000000b" };
const C = { A: "20000000-0000-0000-0000-00000000000a", B: "20000000-0000-0000-0000-00000000000b" };
const M = { A: "30000000-0000-0000-0000-00000000000a", B: "30000000-0000-0000-0000-00000000000b" };
const L = { A: "40000000-0000-0000-0000-00000000000a", B: "40000000-0000-0000-0000-00000000000b" };

for (const [k, id] of Object.entries(U)) await client.query("insert into auth.users (id, email) values ($1, $2)", [id, `${k}@test.cl`]);
for (const k of ["A", "B"]) {
  await client.query("insert into tenants (id, slug, subdomain, nombre) values ($1, $2, $2, $3)", [T[k], `acad-${k.toLowerCase()}`, `Academia ${k}`]);
  await client.query("insert into membresias (user_id, tenant_id) values ($1, $2)", [U[`crea${k}`], T[k]]);
  await client.query("insert into cursos (id, tenant_id, slug, titulo, estado) values ($1, $2, 'c', 'Curso', 'publicado')", [C[k], T[k]]);
  await client.query("insert into modulos (id, tenant_id, curso_id, titulo) values ($1, $2, $3, 'M')", [M[k], T[k], C[k]]);
  await client.query("insert into lecciones (id, tenant_id, curso_id, modulo_id, titulo) values ($1, $2, $3, $4, 'L')", [L[k], T[k], C[k], M[k]]);
  await client.query("insert into invitaciones (tenant_id, curso_id, email) values ($1, $2, $3)", [T[k], C[k], `x${k.toLowerCase()}@test.cl`]);
  await client.query("insert into curso_objetivos (tenant_id, curso_id, orden, texto) values ($1, $2, 1, 'obj')", [T[k], C[k]]);
  await client.query("insert into inscripciones (tenant_id, curso_id, alumno_id) values ($1, $2, $3)", [T[k], C[k], U[`alum${k}`]]);
  await client.query("insert into progreso (tenant_id, curso_id, leccion_id, alumno_id) values ($1, $2, $3, $4)", [T[k], C[k], L[k], U[`alum${k}`]]);
  await client.query("insert into eventos (tenant_id, curso_id, alumno_id, tipo) values ($1, $2, $3, 'inscripcion')", [T[k], C[k], U[`alum${k}`]]);
}

console.log("\nCreador A solo ve su tenant:");
const tablasTenant = ["cursos", "curso_objetivos", "modulos", "lecciones", "invitaciones", "inscripciones", "progreso", "eventos"];
for (const t of tablasTenant) {
  const filas = await como("authenticated", U.creaA, async (c) => (await c.query(`select tenant_id from ${t}`)).rows);
  check(`${t}: ve filas de A y ninguna de B`, filas.length === 1 && filas[0].tenant_id === T.A, `(vio ${filas.length})`);
}
check("tenants: ve solo el suyo", (await como("authenticated", U.creaA, (c) => cuenta(c, "select id from tenants"))) === 1);
check("membresias: ve solo la suya", (await como("authenticated", U.creaA, (c) => cuenta(c, "select * from membresias"))) === 1);

console.log("\nCreador A no escribe en B:");
check("insert curso con tenant B falla", await falla("authenticated", U.creaA, "insert into cursos (tenant_id, slug, titulo) values ($1, 'z', 'Z')", [T.B]));
check("update curso de B afecta 0 filas", (await filasAfectadas("authenticated", U.creaA, "update cursos set titulo='hack' where id=$1", [C.B])) === 0);
check("delete curso de B afecta 0 filas", (await filasAfectadas("authenticated", U.creaA, "delete from cursos where id=$1", [C.B])) === 0);
check("update leccion de B afecta 0 filas", (await filasAfectadas("authenticated", U.creaA, "update lecciones set titulo='hack' where id=$1", [L.B])) === 0);
check("insert inscripcion en B falla", await falla("authenticated", U.creaA, "insert into inscripciones (tenant_id, curso_id, alumno_id) values ($1,$2,$3)", [T.B, C.B, U.libre]));
check("delete progreso de B afecta 0 filas", (await filasAfectadas("authenticated", U.creaA, "delete from progreso where tenant_id=$1", [T.B])) === 0);
check("insert evento en B falla", await falla("authenticated", U.creaA, "insert into eventos (tenant_id, tipo) values ($1,'inscripcion')", [T.B]));
check("update tenant B afecta 0 filas", (await filasAfectadas("authenticated", U.creaA, "update tenants set nombre='hack' where id=$1", [T.B])) === 0);
check("creador A inserta en su tenant (curso)", !(await falla("authenticated", U.creaA, "insert into cursos (tenant_id, slug, titulo) values ($1, 'ok', 'Ok')", [T.A])));

console.log("\nCoherencia de tenant por FK compuesta (sin RLS):");
async function fkFalla(sql, params) {
  try { await client.query("begin"); await client.query(sql, params); return false; } catch { return true; } finally { await client.query("rollback"); }
}
check("leccion de B apuntando a curso de A es rechazada", await fkFalla("insert into lecciones (tenant_id, curso_id, modulo_id, titulo) values ($1,$2,$3,'x')", [T.B, C.A, M.A]));
check("progreso de B con leccion de A es rechazado", await fkFalla("insert into progreso (tenant_id, curso_id, leccion_id, alumno_id) values ($1,$2,$3,$4)", [T.B, C.B, L.A, U.alumB]));
check("inscripcion de B con curso de A es rechazada", await fkFalla("insert into inscripciones (tenant_id, curso_id, alumno_id) values ($1,$2,$3)", [T.B, C.A, U.libre]));

console.log("\nAlumno:");
check("alumA ve solo su inscripcion", (await como("authenticated", U.alumA, async (c) => (await c.query("select alumno_id from inscripciones")).rows.map((r) => r.alumno_id))).join() === U.alumA);
check("alumA ve solo su progreso", (await como("authenticated", U.alumA, (c) => cuenta(c, "select 1 from progreso"))) === 1);
check("alumA no ve eventos (solo creador)", (await como("authenticated", U.alumA, (c) => cuenta(c, "select 1 from eventos"))) === 0);
check("alumA no inserta inscripciones", await falla("authenticated", U.alumA, "insert into inscripciones (tenant_id, curso_id, alumno_id) values ($1,$2,$3)", [T.A, C.A, U.alumA]));
check("alumA no modifica su inscripcion (0 filas)", (await filasAfectadas("authenticated", U.alumA, "update inscripciones set estado='cancelada' where alumno_id=$1", [U.alumA])) === 0);
check("alumA actualiza su propio progreso", (await filasAfectadas("authenticated", U.alumA, "update progreso set completada_at=now() where alumno_id=$1", [U.alumA])) === 1);
check("alumA no toca progreso de alumB (0 filas)", (await filasAfectadas("authenticated", U.alumA, "update progreso set completada_at=now() where alumno_id=$1", [U.alumB])) === 0);
check("alumA no inserta progreso a nombre de otro", await falla("authenticated", U.alumA, "insert into progreso (tenant_id,curso_id,leccion_id,alumno_id) values ($1,$2,$3,$4)", [T.A, C.A, L.A, U.alumB]));
check("alumno sin inscripcion no inserta progreso", await falla("authenticated", U.libre, "insert into progreso (tenant_id,curso_id,leccion_id,alumno_id) values ($1,$2,$3,$4)", [T.A, C.A, L.A, U.libre]));
check("alumA no inserta progreso en curso de B", await falla("authenticated", U.alumA, "insert into progreso (tenant_id,curso_id,leccion_id,alumno_id) values ($1,$2,$3,$4)", [T.B, C.B, L.B, U.alumA]));
check("alumA inserta evento propio en su academia", !(await falla("authenticated", U.alumA, "insert into eventos (tenant_id,curso_id,alumno_id,tipo) values ($1,$2,$3,'leccion_abierta')", [T.A, C.A, U.alumA])));
check("alumA no inserta evento en academia B", await falla("authenticated", U.alumA, "insert into eventos (tenant_id,alumno_id,tipo) values ($1,$2,'leccion_abierta')", [T.B, U.alumA]));
check("alumno sin inscripcion no inserta eventos", await falla("authenticated", U.libre, "insert into eventos (tenant_id,alumno_id,tipo) values ($1,$2,'leccion_abierta')", [T.A, U.libre]));
check("alumA no lee cursos ni lecciones (aun sin politica de alumno)", (await como("authenticated", U.alumA, (c) => cuenta(c, "select 1 from cursos union all select 1 from lecciones"))) === 0);

console.log("\nEventos es append-only:");
check("creador A no actualiza eventos", await falla("authenticated", U.creaA, "update eventos set tipo='curso_completado'"));
check("creador A no borra eventos", await falla("authenticated", U.creaA, "delete from eventos"));

console.log("\nanon:");
for (const t of [...tablasTenant, "tenants", "membresias"]) {
  // Seguro = error de permisos o RLS sin filas visibles.
  const vio = await como("anon", null, (c) => cuenta(c, `select 1 from ${t}`)).catch(() => 0);
  check(`anon no ve filas de ${t}`, vio === 0, `(vio ${vio})`);
}

console.log("\nAlta de academia (RPC):");
check("crear_academia sin sesion falla", await falla("authenticated", null, "select crear_academia('Nueva', 'nueva-acad')"));
check("crear_academia: segundo alta del mismo usuario falla", await falla("authenticated", U.creaA, "select crear_academia('Otra', 'otra-acad')"));
check("crear_academia: usuario nuevo crea su academia y ve solo esa", await como("authenticated", U.libre, async (c) => {
  await c.query("select crear_academia('Libre', 'libre-acad')");
  return (await cuenta(c, "select 1 from tenants")) === 1;
}));
check("crear_academia: subdominio reservado falla", await falla("authenticated", U.libre, "select crear_academia('Admin', 'admin')"));

console.log("\nPostulaciones (tabla de plataforma, aislada por usuario):");
await client.query("insert into postulaciones (user_id, nombre) values ($1, 'Postulante B')", [U.alumB]);
check("postulante inserta la suya y el correo sale de auth.users", await como("authenticated", U.libre, async (c) => {
  await c.query("insert into postulaciones (user_id, nombre, url, alumnos) values ($1, 'Libre', 'linkedin.com/in/x', 'lt30')", [U.libre]);
  return (await c.query("select email from postulaciones")).rows.map((r) => r.email).join() === "libre@test.cl";
}));
check("no inserta a nombre de otro usuario", await falla("authenticated", U.libre, "insert into postulaciones (user_id, nombre) values ($1, 'X')", [U.creaA]));
check("no fija el estado al insertar", await falla("authenticated", U.libre, "insert into postulaciones (user_id, nombre, estado) values ($1, 'X', 'aceptada')", [U.libre]));
check("no fija el correo al insertar", await falla("authenticated", U.libre, "insert into postulaciones (user_id, nombre, email) values ($1, 'X', 'otro@x.cl')", [U.libre]));
check("no ve postulaciones ajenas", (await como("authenticated", U.creaA, (c) => cuenta(c, "select 1 from postulaciones"))) === 0);
check("no edita postulaciones ajenas (0 filas)", (await filasAfectadas("authenticated", U.creaA, "update postulaciones set nombre='hack' where user_id=$1", [U.alumB])) === 0);
check("edita la suya mientras esta 'nueva'", (await filasAfectadas("authenticated", U.alumB, "update postulaciones set nombre='B2' where user_id=$1", [U.alumB])) === 1);
check("no cambia su estado", await falla("authenticated", U.alumB, "update postulaciones set estado='aceptada' where user_id=$1", [U.alumB]));
await client.query("update postulaciones set estado='aceptada' where user_id=$1", [U.alumB]);
check("no edita la suya una vez revisada (0 filas)", (await filasAfectadas("authenticated", U.alumB, "update postulaciones set nombre='B3' where user_id=$1", [U.alumB])) === 0);
check("anon no ve postulaciones", (await como("anon", null, (c) => cuenta(c, "select 1 from postulaciones")).catch(() => 0)) === 0);

console.log(`\n${pass} ok, ${fallos.length} fallos`);
await client.end();
if (fallos.length) { console.log("Fallos:\n - " + fallos.join("\n - ")); process.exit(1); }
