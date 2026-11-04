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
  await client.query("insert into alumnos (id, tenant_id, nombre, correo, password_hash) values ($1, $2, 'Alumno', $3, 'scrypt$x')", [U[`alum${k}`], T[k], `alum${k.toLowerCase()}@test.cl`]);
  await client.query("insert into inscripciones (tenant_id, curso_id, alumno_id, estado) values ($1, $2, $3, 'activa')", [T[k], C[k], U[`alum${k}`]]);
  await client.query("insert into progreso (tenant_id, curso_id, leccion_id, alumno_id) values ($1, $2, $3, $4)", [T[k], C[k], L[k], U[`alum${k}`]]);
  await client.query("insert into eventos (tenant_id, curso_id, alumno_id, tipo) values ($1, $2, $3, 'inscripcion')", [T[k], C[k], U[`alum${k}`]]);
}

console.log("\nCreador A solo ve su tenant:");
const tablasTenant = ["cursos", "curso_objetivos", "modulos", "lecciones", "invitaciones", "inscripciones", "progreso", "eventos", "alumnos"];
for (const t of tablasTenant) {
  const filas = await como("authenticated", U.creaA, async (c) => (await c.query(`select tenant_id from ${t}`)).rows);
  check(`${t}: ve filas de A y ninguna de B`, filas.length === 1 && filas[0].tenant_id === T.A, `(vio ${filas.length})`);
}
check("tenants: ve solo el suyo", (await como("authenticated", U.creaA, (c) => cuenta(c, "select id from tenants"))) === 1);
check("membresias: ve solo la suya", (await como("authenticated", U.creaA, (c) => cuenta(c, "select * from membresias"))) === 1);

await client.query("insert into alumnos (id, tenant_id, nombre, correo, password_hash) values ($1, $2, 'Libre', 'libre@test.cl', 'scrypt$x')", [U.libre, T.A]);
console.log("\nCreador A no escribe en B:");
check("insert curso con tenant B falla", await falla("authenticated", U.creaA, "insert into cursos (tenant_id, slug, titulo) values ($1, 'z', 'Z')", [T.B]));
check("update curso de B afecta 0 filas", (await filasAfectadas("authenticated", U.creaA, "update cursos set titulo='hack' where id=$1", [C.B])) === 0);
check("delete curso de B afecta 0 filas", (await filasAfectadas("authenticated", U.creaA, "delete from cursos where id=$1", [C.B])) === 0);
check("update leccion de B afecta 0 filas", (await filasAfectadas("authenticated", U.creaA, "update lecciones set titulo='hack' where id=$1", [L.B])) === 0);
check("insert inscripcion en B falla", await falla("authenticated", U.creaA, "insert into inscripciones (tenant_id, curso_id, alumno_id) values ($1,$2,$3)", [T.B, C.B, U.alumB]));
check("update inscripcion de B afecta 0 filas", (await filasAfectadas("authenticated", U.creaA, "update inscripciones set estado='rechazada' where tenant_id=$1", [T.B])) === 0);
check("creador A modifica inscripciones de su tenant", (await filasAfectadas("authenticated", U.creaA, "update inscripciones set estado='activa', activada_por='creador' where tenant_id=$1", [T.A])) === 1);
check("insert alumno en B falla", await falla("authenticated", U.creaA, "insert into alumnos (tenant_id, nombre, correo, password_hash) values ($1,'x','x@test.cl','h')", [T.B]));
check("insert pago en B falla", await falla("authenticated", U.creaA, "insert into pagos (tenant_id, inscripcion_id, medio) values ($1, gen_random_uuid(), 'transferencia')", [T.B]));
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

console.log("\nAlumnos (ADR 018): cuenta propia por academia, sin acceso por PostgREST:");
check("mismo correo puede ser alumno de dos academias", !(await falla("service_role", null, "insert into alumnos (tenant_id, nombre, correo, password_hash) select $1, 'Dup', correo, 'h' from alumnos where tenant_id=$2 and id=$3", [T.B, T.A, U.alumA])));
check("correo repetido en la misma academia es rechazado", await fkFalla("insert into alumnos (tenant_id, nombre, correo, password_hash) values ($1,'x','aluma@test.cl','h')", [T.A]));
check("creador A no lee password_hash", await falla("authenticated", U.creaA, "select password_hash from alumnos"));
check("creador A lee nombre y correo de sus alumnos", (await como("authenticated", U.creaA, (c) => cuenta(c, "select nombre, correo from alumnos"))) === 2);
check("anon no lee alumnos", await falla("anon", null, "select 1 from alumnos"));
check("authenticated no lee alumno_tokens", await falla("authenticated", U.creaA, "select 1 from alumno_tokens"));
check("anon no lee inscripciones", await falla("anon", null, "select 1 from inscripciones"));
check("un JWT ajeno (alumA) no ve alumnos, inscripciones ni progreso", (await como("authenticated", U.alumA, (c) => cuenta(c, "select 1 from alumnos union all select 1 from inscripciones union all select 1 from progreso"))) === 0);
check("un JWT ajeno no inserta progreso", await falla("authenticated", U.alumA, "insert into progreso (tenant_id,curso_id,leccion_id,alumno_id) values ($1,$2,$3,$4)", [T.A, C.A, L.A, U.alumA]));
check("progreso con alumno de otra academia es rechazado (FK compuesta)", await fkFalla("insert into progreso (tenant_id,curso_id,leccion_id,alumno_id) values ($1,$2,$3,$4)", [T.B, C.B, L.B, U.alumA]));
check("inscripcion con alumno de otra academia es rechazada (FK compuesta)", await fkFalla("insert into inscripciones (tenant_id, curso_id, alumno_id) values ($1,$2,$3)", [T.B, C.B, U.libre]));
check("token de sesion con alumno de otra academia es rechazado", await fkFalla("insert into alumno_tokens (tenant_id, alumno_id, tipo, token_hash, expira_at) values ($1,$2,'sesion','h',now())", [T.B, U.alumA]));
check("estado de inscripcion invalido es rechazado", await fkFalla("update inscripciones set estado='x'", []));
check("un JWT ajeno no lee cursos ni lecciones", (await como("authenticated", U.alumA, (c) => cuenta(c, "select 1 from cursos union all select 1 from lecciones"))) === 0);

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
check("crear_academia sin acceso (ni staff ni postulacion aceptada) falla con sin_invitacion", await como("authenticated", U.libre, async (c) => {
  try { await c.query("select crear_academia('Libre', 'libre-acad')"); return false; } catch (e) { return /sin_invitacion/.test(e.message); }
}));
// crear_academia exige acceso desde 0006 (staff o postulacion aceptada): "libre" entra como staff solo para el resto de estas pruebas.
await client.query("insert into staff (email, rol) values ('libre@test.cl', 'admin')");
check("crear_academia: usuario nuevo crea su academia y ve solo esa", await como("authenticated", U.libre, async (c) => {
  await c.query("select crear_academia('Libre', 'libre-acad')");
  return (await cuenta(c, "select 1 from tenants")) === 1;
}));
check("crear_academia: subdominio reservado falla", await falla("authenticated", U.libre, "select crear_academia('Admin', 'admin')"));

await client.query("delete from staff where email = 'libre@test.cl'");
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

console.log("\nPagina de la academia (0008, ADR 021):");
for (const k of ["A", "B"]) {
  await client.query("insert into paginas_academia (tenant_id, template, titulo) values ($1, 'programa', $2)", [T[k], `Titulo ${k}`]);
}
check("creador A ve solo su pagina", (await como("authenticated", U.creaA, async (c) => (await c.query("select tenant_id from paginas_academia")).rows.map((r) => r.tenant_id))).join() === T.A);
check("creador A no edita la pagina de B (0 filas)", (await filasAfectadas("authenticated", U.creaA, "update paginas_academia set titulo='hack' where tenant_id=$1", [T.B])) === 0);
check("creador A no borra la pagina de B (0 filas)", (await filasAfectadas("authenticated", U.creaA, "delete from paginas_academia where tenant_id=$1", [T.B])) === 0);
check("creador A no crea pagina para B", await falla("authenticated", U.creaA, "insert into paginas_academia (tenant_id) values ($1) on conflict do nothing", [T.B]));
check("creador A edita su pagina", (await filasAfectadas("authenticated", U.creaA, "update paginas_academia set titulo='Nuevo' where tenant_id=$1", [T.A])) === 1);
check("alumno de A no ve la pagina en borrador", (await como("authenticated", U.alumA, (c) => cuenta(c, "select 1 from paginas_academia"))) === 0);
check("anon no ve paginas", (await como("anon", null, (c) => cuenta(c, "select 1 from paginas_academia")).catch(() => 0)) === 0);
check("template invalido es rechazado", await falla("authenticated", U.creaA, "update paginas_academia set template='otro' where tenant_id=$1", [T.A]));
check("testimonios deben ser un arreglo", await falla("authenticated", U.creaA, "update paginas_academia set testimonios='{}'::jsonb where tenant_id=$1", [T.A]));
check("token de dominio con formato invalido es rechazado", await falla("authenticated", U.creaA, "update paginas_academia set dominio_token='x' where tenant_id=$1", [T.A]));

console.log("\nQuiz de repaso (0009, ADR 022):");
const Q = { A: "50000000-0000-0000-0000-00000000000a", B: "50000000-0000-0000-0000-00000000000b" };
for (const k of ["A", "B"]) {
  await client.query("insert into quiz_preguntas (id, tenant_id, curso_id, modulo_id, texto, opciones, correcta) values ($1, $2, $3, $4, 'P', '[\"Si\", \"No\"]'::jsonb, 0)", [Q[k], T[k], C[k], M[k]]);
}
check("creador A ve solo sus preguntas", (await como("authenticated", U.creaA, async (c) => (await c.query("select tenant_id from quiz_preguntas")).rows.map((r) => r.tenant_id))).join() === T.A);
check("creador A no edita preguntas de B (0 filas)", (await filasAfectadas("authenticated", U.creaA, "update quiz_preguntas set texto='hack' where id=$1", [Q.B])) === 0);
check("creador A no borra preguntas de B (0 filas)", (await filasAfectadas("authenticated", U.creaA, "delete from quiz_preguntas where id=$1", [Q.B])) === 0);
check("creador A no crea preguntas en B", await falla("authenticated", U.creaA, "insert into quiz_preguntas (id, tenant_id, curso_id, modulo_id, opciones) values (gen_random_uuid(), $1, $2, $3, '[\"a\", \"b\"]'::jsonb)", [T.B, C.B, M.B]));
check("creador A edita su pregunta", (await filasAfectadas("authenticated", U.creaA, "update quiz_preguntas set texto='Nueva' where id=$1", [Q.A])) === 1);
check("alumno no lee preguntas (traerian la respuesta)", (await como("authenticated", U.alumA, (c) => cuenta(c, "select 1 from quiz_preguntas"))) === 0);
check("anon no lee preguntas", (await como("anon", null, (c) => cuenta(c, "select 1 from quiz_preguntas")).catch(() => 0)) === 0);
check("pregunta de B con modulo de A es rechazada (FK de tenant)", await fkFalla("insert into quiz_preguntas (id, tenant_id, curso_id, modulo_id, opciones) values (gen_random_uuid(), $1, $2, $3, '[\"a\", \"b\"]'::jsonb)", [T.B, C.B, M.A]));
check("menos de 2 opciones es rechazado", await falla("authenticated", U.creaA, "update quiz_preguntas set opciones='[\"a\"]'::jsonb where id=$1", [Q.A]));
check("mas de 4 opciones es rechazado", await falla("authenticated", U.creaA, "update quiz_preguntas set opciones='[\"a\",\"b\",\"c\",\"d\",\"e\"]'::jsonb where id=$1", [Q.A]));
check("correcta fuera de rango es rechazada", await falla("authenticated", U.creaA, "update quiz_preguntas set correcta=7 where id=$1", [Q.A]));
check("borrar el modulo borra sus preguntas", (await como("authenticated", U.creaA, async (c) => {
  await c.query("delete from modulos where id=$1", [M.A]);
  return cuenta(c, "select 1 from quiz_preguntas");
})) === 0);

console.log("\nRespuestas del quiz (0011, ADR 023):");
const R = { A: "60000000-0000-0000-0000-00000000000a", B: "60000000-0000-0000-0000-00000000000b" };
await client.query("insert into quiz_preguntas (id, tenant_id, curso_id, modulo_id, texto, opciones, correcta) values ($1, $2, $3, $4, 'P', '[\"Si\", \"No\"]'::jsonb, 0) on conflict do nothing", [Q.A, T.A, C.A, M.A]);
for (const k of ["A", "B"]) {
  await client.query("insert into quiz_respuestas (id, tenant_id, curso_id, modulo_id, alumno_id, pregunta_id, opcion, acierto, primer_intento) values ($1, $2, $3, $4, $5, $6, 0, true, true)", [R[k], T[k], C[k], M[k], U[`alum${k}`], Q[k]]);
}
check("creador A ve solo respuestas de su academia", (await como("authenticated", U.creaA, async (c) => (await c.query("select tenant_id from quiz_respuestas")).rows.map((r) => r.tenant_id))).join() === T.A);
check("alumno no lee respuestas por la API (solo el servidor)", (await como("authenticated", U.alumA, (c) => cuenta(c, "select 1 from quiz_respuestas"))) === 0);
check("anon no lee respuestas", (await como("anon", null, (c) => cuenta(c, "select 1 from quiz_respuestas")).catch(() => 0)) === 0);
check("creador A no inserta respuestas", await falla("authenticated", U.creaA, "insert into quiz_respuestas (tenant_id, curso_id, modulo_id, alumno_id, pregunta_id, opcion, acierto) values ($1,$2,$3,$4,$5,0,true)", [T.A, C.A, M.A, U.alumA, Q.A]));
check("alumno no inserta respuestas (se saltaria la correccion)", await falla("authenticated", U.alumA, "insert into quiz_respuestas (tenant_id, curso_id, modulo_id, alumno_id, pregunta_id, opcion, acierto) values ($1,$2,$3,$4,$5,0,true)", [T.A, C.A, M.A, U.alumA, Q.A]));
check("creador A no edita ni borra respuestas de B", await falla("authenticated", U.creaA, "update quiz_respuestas set acierto=false where id=$1", [R.B]) && await falla("authenticated", U.creaA, "delete from quiz_respuestas where id=$1", [R.B]));
check("respuesta con alumno de otra academia es rechazada (FK de tenant)", await fkFalla("insert into quiz_respuestas (tenant_id, curso_id, modulo_id, alumno_id, pregunta_id, opcion, acierto) values ($1,$2,$3,$4,$5,0,true)", [T.A, C.A, M.A, U.alumB, Q.A]));
check("opcion fuera de rango es rechazada", await fkFalla("insert into quiz_respuestas (tenant_id, curso_id, modulo_id, alumno_id, pregunta_id, opcion, acierto) values ($1,$2,$3,$4,$5,9,true)", [T.A, C.A, M.A, U.alumA, Q.A]));
check("borrar la pregunta borra sus respuestas", (await como("authenticated", U.creaA, async (c) => {
  await c.query("delete from quiz_preguntas where id=$1", [Q.A]);
  return cuenta(c, "select 1 from quiz_respuestas");
})) === 0);

console.log("\nRepaso espaciado (0012, ADR 024):");
for (let i = 0; i < 10; i++) {
  await client.query("insert into quiz_respuestas (tenant_id, curso_id, modulo_id, alumno_id, pregunta_id, opcion, acierto, created_at) values ($1,$2,$3,$4,$5,1,false, now() - ($6 || ' minutes')::interval)", [T.A, C.A, M.A, U.alumA, Q.A, String(i)]);
}
const repasoFilas = async (t, a, v) => (await client.query("select * from quiz_respuestas_para_repaso($1, $2, $3)", [t, a, v])).rows.length;
check("la ventana acota las respuestas por pregunta (8 de 11)", (await repasoFilas(T.A, U.alumA, 8)) === 8);
check("una ventana grande se corta en 20 (aqui hay solo 11)", (await repasoFilas(T.A, U.alumA, 500)) === 11);
check("otro alumno/academia no ve filas ajenas", (await repasoFilas(T.A, U.alumB, 8)) === 0 && (await repasoFilas(T.B, U.alumA, 8)) === 0);
check("preguntas solo acertadas no entran al repaso", (await repasoFilas(T.B, U.alumB, 8)) === 0);
check("alumno autenticado no ejecuta la funcion", await falla("authenticated", U.alumA, "select * from quiz_respuestas_para_repaso($1, $2, 8)", [T.A, U.alumA]));
check("anon no ejecuta la funcion", await falla("anon", null, "select * from quiz_respuestas_para_repaso($1, $2, 8)", [T.A, U.alumA]));
check("indices del repaso existen", (await client.query("select 1 from pg_indexes where indexname in ('quiz_respuestas_tenant_alumno_pregunta_fecha_idx','quiz_respuestas_tenant_alumno_falladas_idx')")).rows.length === 2);

console.log(`\n${pass} ok, ${fallos.length} fallos`);
await client.end();
if (fallos.length) { console.log("Fallos:\n - " + fallos.join("\n - ")); process.exit(1); }
