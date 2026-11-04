import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { QuizPlayer } from "../../../../../components/alumno/QuizPlayer";
import { getTenantPublico } from "../../../../../lib/alumno/contexto";
import { inscripcionesDe } from "../../../../../lib/alumno/inscripciones";
import { UMBRAL_DOMINADO } from "../../../../../lib/alumno/quizReglas";
import { repasoDeHoy } from "../../../../../lib/alumno/repaso";
import { getAlumnoActual } from "../../../../../lib/alumno/sesion";

export const metadata: Metadata = { title: "Repaso de hoy" };
export const dynamic = "force-dynamic";

export default async function RepasoPage() {
  const [tenant, alumno] = await Promise.all([getTenantPublico(), getAlumnoActual()]);
  if (!tenant) notFound();
  if (!alumno) redirect("/ingresar?next=%2Frepaso");

  const activos = (await inscripcionesDe(tenant.id, alumno.id)).filter((i) => i.estado === "activa").map((i) => i.cursoId);
  const preguntas = await repasoDeHoy(tenant.id, alumno.id, activos);

  if (preguntas.length === 0) {
    return (
      <section className="al-card">
        <h1>Nada para repasar hoy</h1>
        <p className="al-muted">Cuando falles una pregunta de un quiz, volverá aquí al día siguiente, a los 3 días y a los 7.</p>
        <Link href="/mis-cursos" className="al-btn" style={{ alignSelf: "flex-start" }}>
          Volver a mis cursos
        </Link>
      </section>
    );
  }
  return (
    <div className="al-player">
      <div className="al-leccion">
        <p className="al-crumbs">
          <Link href="/mis-cursos">Mis cursos</Link> › Repaso de hoy
        </p>
        <QuizPlayer modo="repaso" moduloTitulo="" preguntas={preguntas} volverA="/mis-cursos" umbral={UMBRAL_DOMINADO} />
      </div>
    </div>
  );
}
