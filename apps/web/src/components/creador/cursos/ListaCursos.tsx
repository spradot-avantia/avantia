import { BadgeEstadoCurso } from "../Badge";
import { LinkButton } from "../Button";
import { CopiarEnlace } from "../inicio/CopiarEnlace";
import type { CursoResumen } from "../../../lib/creador/types";
import { textoEstudiantes } from "./utils";
import "../inicio/inicio.css";

export interface CursoConUrl
  extends Pick<CursoResumen, "id" | "titulo" | "estado" | "acceso" | "totalEstudiantes" | "totalModulos" | "totalLecciones"> {
  url: string;
}

export function ListaCursos({ cursos, compacto }: { cursos: CursoConUrl[]; compacto?: boolean }) {
  return (
    <ul className="ci-list">
      {cursos.map((c) => (
        <li key={c.id} className={`ci-row${compacto ? " ci-row--compact" : ""}`}>
          <div className="ci-row__main">
            <span className="ci-row__title">{c.titulo}</span>
            <div className="ci-row__meta">
              <BadgeEstadoCurso estado={c.estado} />
              <span>{textoEstudiantes(c.totalEstudiantes, c.acceso)}</span>
              {!compacto && (
                <span>
                  {c.totalModulos} {c.totalModulos === 1 ? "módulo" : "módulos"} · {c.totalLecciones}{" "}
                  {c.totalLecciones === 1 ? "lección" : "lecciones"}
                </span>
              )}
            </div>
          </div>
          <div className="ci-actions">
            {c.estado === "publicado" && <CopiarEnlace url={c.url} etiqueta="Copiar enlace" />}
            <LinkButton href={`/cursos/${c.id}/editar`} variante={c.estado === "publicado" ? "secondary" : "primary"}>
              Editar
            </LinkButton>
          </div>
        </li>
      ))}
    </ul>
  );
}
