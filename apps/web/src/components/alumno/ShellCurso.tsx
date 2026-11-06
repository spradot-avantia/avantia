// Marco de las pantallas de aprendizaje (ADR 033): syllabus a la izquierda, contenido al centro e
// índice de la lección a la derecha (opcional). En móvil todo se apila y los paneles se pliegan.
import type { ReactNode } from "react";
import "./shell-curso.css";

export function ShellCurso({ syllabus, indice, children }: { syllabus: ReactNode; indice?: ReactNode; children: ReactNode }) {
  return (
    <div className={`al-shell${indice ? " al-shell--con-indice" : ""}`}>
      <aside className="al-shell__sil">{syllabus}</aside>
      {indice && <aside className="al-shell__toc">{indice}</aside>}
      <div className="al-shell__main">{children}</div>
    </div>
  );
}
