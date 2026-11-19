// Datos ficticios del video demo (B-48), solo en Supabase **dev**. Correos @demo.invalid.
// La creadora (Valentina) existe de antes, sin academia; todo lo demás se crea aquí y se
// borra con limpiarAcademia() (cascada desde tenants).
import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { rest, URL_DB } from "../e2e/helpers/datos";

if (!URL_DB?.includes("kdvquarwgawaozyzllmd")) {
  throw new Error("El video demo solo corre contra Supabase dev (kdvquarwgawaozyzllmd).");
}

export const PANEL = "https://www.dev.goavantia.com";
export const SUBDOMINIO = "finanzasclaras";
export const ACADEMIA = `https://${SUBDOMINIO}.dev.goavantia.com`;
export const VIDEO_LECCION = "https://drive.google.com/file/d/1J5-VDCgOp4mygos9VDuR2qXbAqQ9c9Aj/view?usp=sharing";
export const PRECIO = "19990";

export const CURSO = {
  titulo: "Finanzas personales en 4 semanas",
  descripcion:
    "Ordena tu sueldo, arma tu fondo de emergencia y empieza a ahorrar con un método simple, en lecciones cortas que puedes ver desde el celular.",
  objetivo: "Repartir tu sueldo con la regla 50/30/20 y sostenerlo mes a mes",
  modulo1: "Tu presupuesto",
  leccion1: "La regla 50/30/20",
  leccion1Desc: "Cómo repartir tu sueldo en necesidades, gustos y ahorro.",
};

export const QUIZ = [
  {
    q: "Con un sueldo líquido de $800.000, ¿cuánto va a ahorro según la regla 50/30/20?",
    r: ["$160.000", "$240.000", "$400.000"],
    c: 0,
    e: "El 20% de $800.000 son $160.000: ahorro y pago de deudas.",
  },
  {
    q: "¿Cuál de estos gastos es una necesidad?",
    r: ["El arriendo", "Una suscripción de streaming", "Una salida a comer"],
    c: 0,
    e: "El arriendo es un gasto básico; los otros dos son gustos (30%).",
  },
  {
    q: "Si tus necesidades pasan del 50%, ¿qué conviene recortar primero?",
    r: ["Los gustos", "El ahorro", "Nada: el 50% no importa"],
    c: 0,
    e: "Ajusta primero los gustos para no dejar de ahorrar.",
  },
];

export const ALUMNO = { nombre: "Matías Soto", correo: "matias@demo.invalid", clave: "Demo-Matias-2026!" };

export function credencialesCreadora(): { email: string; password: string } {
  const ruta = process.env.DEMO_CRED;
  if (!ruta) throw new Error("Falta DEMO_CRED (JSON con las credenciales de la creadora ficticia).");
  return JSON.parse(readFileSync(ruta, "utf8"));
}

export async function academia(): Promise<{ id: string } | null> {
  const r = await rest("tenants", { query: `select=id&subdomain=eq.${SUBDOMINIO}` });
  return r.data?.[0] ?? null;
}

/** Borra la academia de la demo y todo lo que cuelga de ella (FK en cascada). */
export async function limpiarAcademia() {
  const t = await academia();
  if (!t) return;
  await rest("tenants", { method: "DELETE", query: `id=eq.${t.id}&subdomain=eq.${SUBDOMINIO}` });
  // lib/tenant/resolve.ts guarda el host → tenant 60 s en memoria: si se recrea antes, la
  // instancia de Vercel sigue apuntando al tenant borrado y la ficha da 404.
  await new Promise((r) => setTimeout(r, 65_000));
}

export async function cursoDemo(tenantId: string) {
  const c = await rest("cursos", { query: `select=id,slug,estado&tenant_id=eq.${tenantId}&order=created_at.desc&limit=1` });
  return c.data[0] as { id: string; slug: string; estado: string };
}

/**
 * Módulos 2 y 3 con nombre y una lección de texto cada uno (se hace en un corte del
 * video: en cámara solo se arma el módulo 1). Sin esto el curso no se puede publicar.
 */
export async function completarModulosRestantes(tenantId: string, cursoId: string) {
  const mods = await rest("modulos", { query: `select=id,orden&tenant_id=eq.${tenantId}&curso_id=eq.${cursoId}&order=orden.asc` });
  const resto = [
    { titulo: "Tu fondo de emergencia", leccion: "Cuánto juntar y dónde guardarlo", texto: "Un fondo de emergencia cubre de 3 a 6 meses de gastos básicos. Guárdalo aparte de tu cuenta del día a día, en un lugar donde puedas sacarlo rápido." },
    { titulo: "Ahorro que crece", leccion: "Tu primer plan de ahorro", texto: "Define una meta, un monto mensual y una fecha. Programa la transferencia el día de pago y revisa tu avance una vez al mes." },
  ];
  for (const [i, m] of mods.data.slice(1, 3).entries()) {
    await rest("modulos", { method: "PATCH", query: `tenant_id=eq.${tenantId}&id=eq.${m.id}`, body: { titulo: resto[i].titulo } });
    const ya = await rest("lecciones", { query: `select=id&tenant_id=eq.${tenantId}&modulo_id=eq.${m.id}` });
    if (!ya.data.length) {
      await rest("lecciones", {
        method: "POST",
        body: { tenant_id: tenantId, curso_id: cursoId, modulo_id: m.id, titulo: resto[i].leccion, tipo: "texto", contenido_texto: resto[i].texto, orden: 1, duracion_min: 6 },
      });
    }
  }
}

/** Confirma el correo del alumno con un token conocido; devuelve la URL de confirmación. */
export async function urlConfirmacion(tenantId: string, correo: string): Promise<string> {
  const al = await rest("alumnos", { query: `select=id&tenant_id=eq.${tenantId}&correo=eq.${correo}` });
  const token = randomUUID() + randomUUID();
  await rest("alumno_tokens", {
    method: "POST",
    body: {
      tenant_id: tenantId,
      alumno_id: al.data[0].id,
      tipo: "confirmar",
      token_hash: createHash("sha256").update(token).digest("hex"),
      expira_at: new Date(Date.now() + 3600e3).toISOString(),
    },
  });
  return `${ACADEMIA}/confirmar?token=${token}`;
}

const FONDO = [
  { nombre: "Camila Pérez", avance: 3, aciertos: [1, 1, 1], dias: 0 },
  { nombre: "Diego Muñoz", avance: 3, aciertos: [1, 1, 0], dias: 1 },
  { nombre: "Fernanda Lagos", avance: 2, aciertos: [1, 0, 1], dias: 0 },
  { nombre: "Ignacio Vera", avance: 1, aciertos: [0, 1, 0], dias: 2 },
  { nombre: "Josefa Araya", avance: 2, aciertos: [1, 1, 1], dias: 1 },
  { nombre: "Tomás Fuentes", avance: 1, aciertos: [0, 0, 1], dias: 9 },
  { nombre: "Antonia Silva", avance: 0, aciertos: [], dias: 10 },
];

/**
 * Alumnos de fondo para que el Inicio de la creadora no salga vacío: inscripción activa,
 * lecciones completadas, quiz con aciertos variados y eventos recientes. Rótulo en el video:
 * «Datos de demostración».
 */
export async function sembrarAlumnosDeFondo(tenantId: string, cursoId: string) {
  const lecs = await rest("lecciones", { query: `select=id,modulo_id&tenant_id=eq.${tenantId}&curso_id=eq.${cursoId}&order=orden.asc` });
  const mods = await rest("modulos", { query: `select=id,orden&tenant_id=eq.${tenantId}&curso_id=eq.${cursoId}&order=orden.asc` });
  const ordenMod = new Map<string, number>(mods.data.map((m: { id: string; orden: number }) => [m.id, m.orden]));
  const lecciones = [...lecs.data].sort((a, b) => (ordenMod.get(a.modulo_id) ?? 0) - (ordenMod.get(b.modulo_id) ?? 0));
  const pregs = await rest("quiz_preguntas", { query: `select=id,modulo_id,correcta&tenant_id=eq.${tenantId}&curso_id=eq.${cursoId}&order=orden.asc` });
  const hace = (dias: number, horas = 0) => new Date(Date.now() - dias * 864e5 - horas * 36e5).toISOString();

  for (const [i, f] of FONDO.entries()) {
    const correo = `alumno${i + 1}@demo.invalid`;
    const a = await rest("alumnos", {
      method: "POST",
      body: { tenant_id: tenantId, nombre: f.nombre, correo, password_hash: "demo-sin-acceso", correo_verificado_at: hace(f.dias + 5), consentimiento_at: hace(f.dias + 5), ultimo_ingreso_at: hace(f.dias) },
    });
    const alumnoId = a.data[0].id;
    await rest("inscripciones", {
      method: "POST",
      body: { tenant_id: tenantId, curso_id: cursoId, alumno_id: alumnoId, estado: "activa", origen: "pagina", activada_por: "pago", activada_en: hace(f.dias + 4), created_at: hace(f.dias + 4) },
    });
    for (const [k, l] of lecciones.slice(0, f.avance).entries()) {
      const fecha = hace(f.dias, 8 - k * 2);
      await rest("progreso", { method: "POST", body: { tenant_id: tenantId, curso_id: cursoId, leccion_id: l.id, alumno_id: alumnoId, completada_at: fecha, ultimo_acceso_at: fecha } });
      await rest("eventos", { method: "POST", body: { tenant_id: tenantId, curso_id: cursoId, alumno_id: alumnoId, tipo: "leccion_completada", entidad_tipo: "leccion", entidad_id: l.id, created_at: fecha } });
    }
    for (const [k, acierto] of f.aciertos.entries()) {
      const p = pregs.data[k];
      if (!p) continue;
      const fecha = hace(f.dias, 6);
      await rest("quiz_respuestas", {
        method: "POST",
        body: { tenant_id: tenantId, curso_id: cursoId, modulo_id: p.modulo_id, alumno_id: alumnoId, pregunta_id: p.id, opcion: acierto ? p.correcta : (p.correcta + 1) % 3, acierto: !!acierto, primer_intento: true, created_at: fecha, duracion_ms: 9000 + k * 2500 },
      });
    }
    if (f.aciertos.length) {
      await rest("eventos", { method: "POST", body: { tenant_id: tenantId, curso_id: cursoId, alumno_id: alumnoId, tipo: "intento_quiz", entidad_tipo: "quiz", entidad_id: pregs.data[0]?.modulo_id, created_at: hace(f.dias, 6) } });
    }
  }
}

/** Solo validación (sin grabar): activa la inscripción del alumno sin pasar por Mercado Pago. */
export async function activarSinPago(tenantId: string, correo: string) {
  const al = await rest("alumnos", { query: `select=id&tenant_id=eq.${tenantId}&correo=eq.${correo}` });
  await rest("inscripciones", {
    method: "PATCH",
    query: `tenant_id=eq.${tenantId}&alumno_id=eq.${al.data[0].id}`,
    body: { estado: "activa", activada_por: "creador", activada_en: new Date().toISOString() },
  });
}
