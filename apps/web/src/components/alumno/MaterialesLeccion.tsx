// Materiales de una lección (ADR 029 F3 / ADR 030): los de la lección y los del módulo.
// Server component sin estado. Los archivos se abren por una ruta del servidor que firma la
// URL; el enlace nunca contiene la ruta interna del bucket.
import { IconoDocumento, IconoEnlace } from "../ui/Iconos";
import { hrefMaterial, rotuloMaterial, type MaterialAlumno } from "../../lib/alumno/materialesReglas";

function Lista({ materiales, cursoId, id, titulo }: { materiales: MaterialAlumno[]; cursoId: string; id: string; titulo: string }) {
  if (materiales.length === 0) return null;
  return (
    <section className="al-mats" aria-labelledby={id}>
      <h2 id={id} className="al-mats__t">
        {titulo}
      </h2>
      <ul className="al-mats__lista">
        {materiales.map((m) => {
          const href = hrefMaterial(m, cursoId);
          return (
            <li key={m.id} className="al-mat">
              <span className="al-mat__ico" aria-hidden="true">
                {m.origen === "enlace" ? <IconoEnlace tam={20} /> : <IconoDocumento tam={20} />}
              </span>
              {href ? (
                <a className="al-mat__enlace" href={href} target="_blank" rel="noopener noreferrer">
                  {m.titulo}
                  <span className="av-sr-only"> (se abre en una pestaña nueva)</span>
                </a>
              ) : (
                <span>{m.titulo}</span>
              )}
              <span className="al-mat__meta">{rotuloMaterial(m)}</span>
              {m.nota && <span className="al-mat__nota">{m.nota}</span>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function MaterialesLeccion({
  cursoId,
  deLaLeccion,
  delModulo,
}: {
  cursoId: string;
  deLaLeccion: MaterialAlumno[];
  delModulo: MaterialAlumno[];
}) {
  if (deLaLeccion.length === 0 && delModulo.length === 0) return null;
  return (
    <div className="al-mats-grupo">
      <Lista materiales={deLaLeccion} cursoId={cursoId} id="al-mats-leccion" titulo="Materiales de esta lección" />
      <Lista materiales={delModulo} cursoId={cursoId} id="al-mats-modulo" titulo="Materiales del módulo" />
    </div>
  );
}
