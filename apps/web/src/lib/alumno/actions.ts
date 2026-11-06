"use server";

// Server Actions del sitio de la academia (lado alumno). El tenant sale del host;
// nada de lo que llega en el formulario decide a qué academia se escribe.
import { cargarCurso } from "./catalogo";
import {
  confirmarCorreo,
  ingresarAlumno,
  pedirRecuperacion,
  registrarAlumno,
  reenviarConfirmacion,
  restablecerContrasena,
  type EstadoForm,
} from "./cuentas";
import { requireTenantPublico } from "./contexto";
import { solicitarInscripcion } from "./inscripciones";
import { completarLeccion } from "./progreso";
import { responderPregunta, type ResultadoResponder } from "./quiz";
import { cerrarSesion, getAlumnoActual } from "./sesion";
import { limpiarCampana, sanitizarNextAlumno } from "./validacion";

/**
 * Las acciones NO usan redirect(): en los dominios de academia (reescritos por el
 * middleware a [domain]) Next resuelve el destino sin esa reescritura y entrega un
 * 404. Devuelven `irA` y el cliente navega con una petición normal (FormAccion).
 */
const destino = (ruta: string): EstadoForm => ({ ok: true, irA: ruta });

const txt = (fd: FormData, k: string) => (typeof fd.get(k) === "string" ? (fd.get(k) as string) : "");

export async function registrarAction(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const origen = txt(fd, "origen") === "anuncio" ? "anuncio" : "pagina";
  return registrarAlumno({
    nombre: txt(fd, "nombre"),
    email: txt(fd, "email"),
    password: txt(fd, "password"),
    terminos: fd.get("terminos") === "on",
    cursoSlug: txt(fd, "curso") || null,
    origen,
    campana: limpiarCampana(txt(fd, "campana")),
  });
}

export async function ingresarAction(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const r = await ingresarAlumno({ email: txt(fd, "email"), password: txt(fd, "password") });
  return r.ok ? destino(sanitizarNextAlumno(txt(fd, "next"))) : r;
}

export async function salirAction(): Promise<EstadoForm> {
  await cerrarSesion();
  return destino("/");
}

export async function recuperarAction(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  return pedirRecuperacion(txt(fd, "email"));
}

export async function reenviarConfirmacionAction(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  return reenviarConfirmacion(txt(fd, "email"));
}

export async function restablecerAction(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const r = await restablecerContrasena({ token: txt(fd, "token"), password: txt(fd, "password"), confirmacion: txt(fd, "confirmacion") });
  return r.ok ? destino("/mis-cursos") : r;
}

export async function confirmarAction(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const r = await confirmarCorreo(txt(fd, "token"));
  return r.ok ? destino("/mis-cursos") : r;
}

/** "Inscribirme" desde la ficha del curso (el alumno ya tiene sesión). */
export async function inscribirseAction(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const tenant = await requireTenantPublico();
  const slug = txt(fd, "curso");
  const alumno = await getAlumnoActual();
  if (!alumno) return destino(`/ingresar?next=${encodeURIComponent(`/curso/${slug}`)}`);
  const curso = await cargarCurso(tenant.id, { slug });
  if (!curso) return destino("/");
  const r = await solicitarInscripcion(tenant.id, alumno, curso, {
    origen: "pagina",
    campana: limpiarCampana(txt(fd, "campana")),
    solicitud: txt(fd, "solicitud") === "1",
  });
  return r.ok ? destino("/mis-cursos") : { ok: false, error: r.error };
}

export async function completarLeccionAction(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const tenant = await requireTenantPublico();
  const alumno = await getAlumnoActual();
  if (!alumno) return destino("/ingresar");
  const cursoId = txt(fd, "cursoId");
  const leccionId = txt(fd, "leccionId");
  const r = await completarLeccion(tenant.id, alumno.id, cursoId, leccionId);
  const base = `/aprender/${encodeURIComponent(cursoId)}`;
  if (!r.ok) return { ok: false, error: r.error };
  if (r.cursoCompleto) return destino(`${base}/completado`);
  // Última lección del módulo: el alumno se queda en ella (ya completada) para ver el quiz de
  // repaso y pasar al módulo siguiente por su presentación (ADR 032, punto 8).
  if (r.finDeModulo) return destino(`${base}/${encodeURIComponent(leccionId)}?ganaste=${r.xpGanada}`);
  if (r.siguienteId) return destino(`${base}/${encodeURIComponent(r.siguienteId)}?ganaste=${r.xpGanada}`);
  return destino(`${base}/${encodeURIComponent(leccionId)}`);
}

/** Corrige una respuesta del quiz. El tenant sale del host y el alumno de la sesión. */
export async function responderQuizAction(cursoId: string, moduloId: string, preguntaId: string, opcion: number): Promise<ResultadoResponder> {
  const tenant = await requireTenantPublico();
  const alumno = await getAlumnoActual();
  if (!alumno) return { ok: false, error: "Tu sesión expiró. Ingresa de nuevo." };
  return responderPregunta(tenant.id, alumno.id, String(cursoId), String(moduloId), String(preguntaId), Number(opcion));
}
