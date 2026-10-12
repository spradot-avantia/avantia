import { leccionLista } from "../../lib/creador/reglasPublicacion";
import type { CursoCompleto, Leccion, TenantCreador } from "../../lib/creador/types";
import { urlEmbebible } from "../../lib/creador/validacion";
import { TenantMark } from "../creador/TenantMark";
import { MarkdownMinimo } from "./MarkdownMinimo";
import "./ficha-curso.css";

type TenantFicha = Pick<TenantCreador, "nombre" | "logoUrl" | "logoModo" | "colorPrimario">;

const TIPO: Record<Leccion["tipo"], string> = { video: "Video", texto: "Texto", documento: "Documento" };

function fecha(f: string | null): string {
  if (!f) return "";
  return new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${f}T00:00:00Z`),
  );
}

function plural(n: number, uno: string, varios: string) {
  return `${n} ${n === 1 ? uno : varios}`;
}

function ContenidoLeccion({ l }: { l: Leccion }) {
  if (!leccionLista(l)) return <p className="fc-lec__vacio">Esta lección aún no tiene contenido.</p>;
  if (l.tipo === "texto") return <MarkdownMinimo texto={l.contenidoTexto ?? ""} />;
  if (l.tipo === "video") {
    const src = l.contenidoUrl ? urlEmbebible(l.contenidoUrl) : null;
    return src ? (
      <div className="fc-video">
        <iframe
          src={src}
          title={l.titulo}
          loading="lazy"
          allow="fullscreen; picture-in-picture"
          sandbox="allow-scripts allow-same-origin allow-presentation"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    ) : (
      <p className="fc-lec__vacio">No pudimos mostrar este video.</p>
    );
  }
  return (
    <p>
      <a href={l.contenidoUrl ?? "#"} target="_blank" rel="noopener noreferrer">
        Abrir documento
      </a>{" "}
      <span className="fc-muted">(se abre en una pestaña nueva)</span>
    </p>
  );
}

interface Props {
  tenant: TenantFicha;
  curso: CursoCompleto;
  /** Vista previa del creador: CTAs desactivados y contenido de lecciones visible. */
  preview?: boolean;
  /** Destino del boton de inscripcion cuando no es vista previa. */
  ctaHref?: string;
}

/** Ficha de curso tal como la ve un estudiante. Se adapta al ancho de su contenedor. */
export function FichaCurso({ tenant, curso, preview = false, ctaHref }: Props) {
  const totalLecciones = curso.modulos.reduce((n, m) => n + m.lecciones.length, 0);
  const modalidad =
    curso.modalidad === "con_fechas" && curso.fechaInicio
      ? `Del ${fecha(curso.fechaInicio)}${curso.fechaTermino ? ` al ${fecha(curso.fechaTermino)}` : ""}`
      : "A su ritmo";
  const cta = curso.acceso === "invitados" ? "Entrar al curso" : "Inscribirme";
  const objetivos = curso.objetivos.filter((o) => o.trim());

  return (
    <article className="fc" style={{ ["--fc-brand" as string]: tenant.colorPrimario }}>
      <header className="fc-top">
        <TenantMark nombre={tenant.nombre} logoUrl={tenant.logoUrl} logoModo={tenant.logoModo} color={tenant.colorPrimario} />
      </header>

      <section className="fc-hero">
        <p className="fc-meta">
          <span>{modalidad}</span>
          <span aria-hidden="true">·</span>
          <span>
            {plural(curso.modulos.length, "módulo", "módulos")} · {plural(totalLecciones, "lección", "lecciones")}
          </span>
        </p>
        <h2 className="fc-title">{curso.titulo}</h2>
        {curso.descripcion && <p className="fc-desc">{curso.descripcion}</p>}
        {curso.publico && <p className="fc-publico">{curso.publico}</p>}
        {preview || !ctaHref ? (
          <button type="button" className="fc-cta" disabled aria-disabled="true">
            {cta}
          </button>
        ) : (
          <a className="fc-cta" href={ctaHref}>
            {cta}
          </a>
        )}
      </section>

      {objetivos.length > 0 && (
        <section className="fc-sec" aria-labelledby="fc-obj">
          <h3 id="fc-obj">Lo que podrás hacer</h3>
          <ul className="fc-obj">
            {objetivos.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="fc-sec" aria-labelledby="fc-cont">
        <h3 id="fc-cont">Contenido del curso</h3>
        {curso.modulos.length === 0 && <p className="fc-muted">Este curso aún no tiene módulos.</p>}
        {curso.modulos.map((m, i) => (
          <div className="fc-mod" key={m.id}>
            <p className="fc-mod__n">
              Módulo {i + 1} · {plural(m.lecciones.length, "lección", "lecciones")}
            </p>
            <h4 className="fc-mod__t">{m.titulo}</h4>
            <ul className="fc-lecs">
              {m.lecciones.map((l) =>
                preview ? (
                  <li key={l.id}>
                    <details className="fc-lec">
                      <summary>
                        <span>{l.titulo}</span>
                        <span className="fc-tipo">{TIPO[l.tipo]}</span>
                      </summary>
                      <div className="fc-lec__body">
                        <ContenidoLeccion l={l} />
                      </div>
                    </details>
                  </li>
                ) : (
                  <li key={l.id} className="fc-lec fc-lec--plana">
                    <span>{l.titulo}</span>
                    <span className="fc-tipo">{TIPO[l.tipo]}</span>
                  </li>
                ),
              )}
            </ul>
          </div>
        ))}
      </section>
    </article>
  );
}
