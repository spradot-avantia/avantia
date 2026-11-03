// Guardia común de las páginas del curso: sesión + inscripción ACTIVA + curso publicado.
import { notFound, redirect } from "next/navigation";
import type { Tenant } from "../../types/tenant";
import { cargarCurso, type CursoParaAlumno } from "./catalogo";
import { getTenantPublico } from "./contexto";
import { inscripcionDe } from "./inscripciones";
import { leccionesCompletadas } from "./progreso";
import { getAlumnoActual, type AlumnoSesion } from "./sesion";

export interface ContextoCurso {
  tenant: Tenant;
  alumno: AlumnoSesion;
  curso: CursoParaAlumno;
  completadas: Set<string>;
}

export async function exigirCursoActivo(cursoId: string, next: string): Promise<ContextoCurso> {
  const tenant = await getTenantPublico();
  if (!tenant) notFound();
  const alumno = await getAlumnoActual();
  if (!alumno) redirect(`/ingresar?next=${encodeURIComponent(next)}`);

  const insc = await inscripcionDe(tenant.id, alumno.id, cursoId);
  // Sin inscripción activa no se abre el contenido: se vuelve a Mis cursos, que explica el estado.
  if (!insc || insc.estado !== "activa") redirect("/mis-cursos");

  const curso = await cargarCurso(tenant.id, { id: cursoId });
  if (!curso) notFound();
  const completadas = await leccionesCompletadas(tenant.id, alumno.id, cursoId);
  return { tenant, alumno, curso, completadas };
}
