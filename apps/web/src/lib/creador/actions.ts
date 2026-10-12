"use server";

// Server Actions del Espacio del Creador: UNICA superficie que usan las
// paginas/clientes. Ninguna recibe tenant_id: el tenant sale de la sesion
// (ver tenantActual.ts). Todas devuelven Resultado serializable.
import { revalidatePath } from "next/cache";
import * as academia from "./academia";
import * as cursos from "./cursos";
import * as estructura from "./estructura";
import * as estudiantes from "./estudiantes";
import * as publicacion from "./publicacion";
import type {
  CampoCurso,
  ModoCreacionCurso,
  PasoEditor,
  Resultado,
  ResultadoValidacionPublicacion,
  TenantCreador,
  TipoLeccion,
} from "./types";

async function seguro<T>(fn: () => Promise<Resultado<T>>, rutas: string[] = []): Promise<Resultado<T>> {
  try {
    const r = await fn();
    if (r.ok) for (const ruta of rutas) revalidatePath(ruta, "layout");
    return r;
  } catch (e) {
    if (e instanceof Error && e.name === "SinTenantError") return { ok: false, error: e.message };
    console.error("[creador] acción falló", e);
    return { ok: false, error: "Algo salió mal. Inténtalo de nuevo." };
  }
}

const RUTAS_CURSOS = ["/", "/cursos"];

// ---- Academia -------------------------------------------------------------
export async function guardarMarcaAction(input: academia.MarcaInput): Promise<Resultado<TenantCreador>> {
  return seguro(() => academia.actualizarMarca(input), ["/"]);
}
export async function completarOnboardingAction(input: academia.MarcaInput): Promise<Resultado<TenantCreador>> {
  return seguro(() => academia.completarOnboarding(input), ["/"]);
}
/** FormData con el campo "logo" (File). */
export async function subirLogoAction(formData: FormData): Promise<Resultado<TenantCreador>> {
  const f = formData.get("logo");
  if (!(f instanceof File) || f.size === 0) return { ok: false, error: "Selecciona un archivo." };
  return seguro(() => academia.subirLogo(f), ["/"]);
}
export async function quitarLogoAction(): Promise<Resultado<TenantCreador>> {
  return seguro(() => academia.quitarLogo(), ["/"]);
}

// ---- Cursos ---------------------------------------------------------------
export async function crearCursoAction(input: { titulo?: string; modo: ModoCreacionCurso }): Promise<Resultado<{ id: string }>> {
  return seguro(() => cursos.crearCurso(input), RUTAS_CURSOS);
}
export async function guardarCampoCursoAction(cursoId: string, campo: CampoCurso, valor: unknown): Promise<Resultado> {
  return seguro(() => cursos.updateCursoCampo(cursoId, campo, valor));
}
export async function guardarPasoAction(cursoId: string, paso: PasoEditor, datos: Partial<Record<CampoCurso, unknown>>): Promise<Resultado> {
  return seguro(() => cursos.updatePaso(cursoId, paso, datos));
}
export async function eliminarCursoAction(cursoId: string): Promise<Resultado> {
  return seguro(() => cursos.eliminarCurso(cursoId), RUTAS_CURSOS);
}

// ---- Modulos y lecciones --------------------------------------------------
export async function crearModuloAction(cursoId: string, titulo: string) {
  return seguro(() => estructura.crearModulo(cursoId, titulo));
}
export async function renombrarModuloAction(moduloId: string, titulo: string) {
  return seguro(() => estructura.renombrarModulo(moduloId, titulo));
}
export async function moverModuloAction(moduloId: string, direccion: "subir" | "bajar") {
  return seguro(() => estructura.moverModulo(moduloId, direccion));
}
export async function eliminarModuloAction(moduloId: string) {
  return seguro(() => estructura.eliminarModulo(moduloId));
}
export async function crearLeccionAction(moduloId: string, input: { titulo: string; tipo: TipoLeccion }) {
  return seguro(() => estructura.crearLeccion(moduloId, input));
}
export async function actualizarLeccionAction(leccionId: string, patch: estructura.LeccionPatch) {
  return seguro(() => estructura.actualizarLeccion(leccionId, patch));
}
export async function moverLeccionAction(leccionId: string, direccion: "subir" | "bajar") {
  return seguro(() => estructura.moverLeccion(leccionId, direccion));
}
export async function eliminarLeccionAction(leccionId: string) {
  return seguro(() => estructura.eliminarLeccion(leccionId));
}

// ---- Publicacion ----------------------------------------------------------
export async function validarPublicacionAction(cursoId: string): Promise<Resultado<ResultadoValidacionPublicacion>> {
  return seguro(() => publicacion.validarCursoParaPublicar(cursoId));
}
export async function publicarCursoAction(cursoId: string): Promise<Resultado<{ url: string; slug: string }>> {
  return seguro(() => publicacion.publicarCurso(cursoId), RUTAS_CURSOS);
}
export async function despublicarCursoAction(cursoId: string): Promise<Resultado> {
  return seguro(() => publicacion.despublicarCurso(cursoId), RUTAS_CURSOS);
}

// ---- Estudiantes ----------------------------------------------------------
export async function registrarEstudiantesAction(cursoId: string, texto: string): Promise<Resultado<estudiantes.ResumenRegistro>> {
  return seguro(() => estudiantes.registrarEstudiantes(cursoId, texto), ["/", "/estudiantes", "/cursos"]);
}
export async function quitarEstudianteAction(invitacionId: string): Promise<Resultado> {
  return seguro(() => estudiantes.quitarEstudiante(invitacionId), ["/estudiantes"]);
}
