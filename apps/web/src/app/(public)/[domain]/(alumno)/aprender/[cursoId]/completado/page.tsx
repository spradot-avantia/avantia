import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Insignia, Sello } from "../../../../../../../components/alumno/Piezas";
import { exigirCursoActivo } from "../../../../../../../lib/alumno/guardia";
import { calcularXp, nivelDe } from "../../../../../../../lib/alumno/xp";

export const metadata: Metadata = { title: "Curso completado" };
export const dynamic = "force-dynamic";

export default async function CompletadoPage({ params }: { params: { cursoId: string } }) {
  const { curso, completadas } = await exigirCursoActivo(params.cursoId, `/aprender/${params.cursoId}/completado`);
  const d = calcularXp(curso, completadas);
  // Solo se llega aquí con el curso terminado.
  if (!d.cursoCompleto) redirect(`/aprender/${curso.id}`);
  const nivel = nivelDe(d.xp);

  return (
    <>
      <section className="al-hero">
        <p className="al-hecho">
          <Sello />
          Curso completado
        </p>
        <h1>¡Lo lograste! Terminaste «{curso.titulo}»</h1>
        <p className="al-lede">
          Completaste {d.lecciones} {d.lecciones === 1 ? "lección" : "lecciones"} y sumaste <strong>{d.xp} XP</strong>. Ya estás en el nivel{" "}
          {nivel.nivel}.
        </p>
      </section>

      {curso.objetivos.length > 0 && (
        <section className="al-card">
          <h2>Lo que ahora puedes hacer</h2>
          <ul>
            {curso.objetivos.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="al-stack">
        <h2>Tu insignia</h2>
        <ul className="al-insignias">
          <Insignia activa icono={<Sello tam={22} />} titulo="Curso completado">
            Todas las lecciones.
          </Insignia>
        </ul>
      </section>

      <div className="al-pager" style={{ justifyContent: "flex-start" }}>
        <Link href="/progreso" className="al-btn">
          Ver mi progreso
        </Link>
        <Link href={`/aprender/${curso.id}`} className="al-btn al-btn--sec">
          Repasar el curso
        </Link>
        <Link href="/mis-cursos" className="al-btn al-btn--sec">
          Mis cursos
        </Link>
      </div>
    </>
  );
}
