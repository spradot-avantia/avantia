import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { QuizPlayer } from "../../../../../../../../components/alumno/QuizPlayer";
import { leccionesEnOrden } from "../../../../../../../../lib/alumno/catalogo";
import { exigirCursoActivo } from "../../../../../../../../lib/alumno/guardia";
import { quizDelModulo, UMBRAL_DOMINADO } from "../../../../../../../../lib/alumno/quiz";

export const metadata: Metadata = { title: "Quiz de repaso" };
export const dynamic = "force-dynamic";

export default async function QuizPage({ params }: { params: { cursoId: string; moduloId: string } }) {
  const { tenant, curso, completadas } = await exigirCursoActivo(params.cursoId, `/aprender/${params.cursoId}/quiz/${params.moduloId}`);
  const mod = curso.modulos.find((m) => m.id === params.moduloId);
  if (!mod) notFound();
  const quiz = await quizDelModulo(tenant.id, curso.id, mod.id);
  if (!quiz) notFound();

  // Al terminar: la siguiente lección sin completar, o el cierre del curso.
  const pendiente = leccionesEnOrden(curso).find((l) => !completadas.has(l.id));
  const volverA = pendiente ? `/aprender/${curso.id}/${pendiente.id}` : `/aprender/${curso.id}/completado`;

  return (
    <div className="al-player">
      <div className="al-leccion">
        <p className="al-crumbs">
          <Link href="/mis-cursos">Mis cursos</Link> › {curso.titulo}
        </p>
        <QuizPlayer
          cursoId={curso.id}
          moduloId={mod.id}
          moduloTitulo={mod.titulo}
          preguntas={quiz.preguntas}
          volverA={volverA}
          umbral={UMBRAL_DOMINADO}
        />
      </div>
    </div>
  );
}
