import Link from "next/link";
import { iniciales } from "../../../lib/creador/color";
import type { AlumnoEnRiesgo, DistribucionAvance, DistribucionDominio } from "../../../lib/creador/actividadReglas";
import "./inicio.css";

type Tono = "ok" | "prog" | "bajo" | "vacio";
interface Parte {
  label: string;
  n: number;
  tono: Tono;
}

/** Barra apilada + leyenda con cifras. La barra es decorativa: la leyenda trae los números. */
function Distribucion({ partes, total, nombre }: { partes: Parte[]; total: number; nombre: string }) {
  return (
    <>
      <div className="ci-dist" aria-hidden="true">
        {total > 0 &&
          partes
            .filter((p) => p.n > 0)
            .map((p) => <i key={p.label} className={`ci-seg ci-seg--${p.tono}`} style={{ width: `${(p.n / total) * 100}%` }} />)}
      </div>
      <ul className="ci-leyenda" aria-label={nombre}>
        {partes.map((p) => (
          <li key={p.label}>
            <i className={`ci-seg ci-seg--${p.tono}`} aria-hidden="true" />
            <span>{p.label}</span>
            <strong>{p.n}</strong>
          </li>
        ))}
      </ul>
    </>
  );
}

interface Props {
  /** Dominio medio (0–100) de las inscripciones activas con quiz respondido; null si no hay. */
  dominioMedio: number | null;
  dominio: DistribucionDominio;
  /** Promedio de avance de inscripciones activas (0–100), o null si no hay. */
  avancePromedio: number | null;
  avance: DistribucionAvance;
  /** Estudiantes únicos con inscripción activa. */
  estudiantes: number;
  porCurso: { cursoId: string; curso: string; n: number }[];
  /** Estudiantes (únicos) con dominio bajo o 7+ días sin entrar. */
  enRiesgo: AlumnoEnRiesgo[];
}

/**
 * KPIs del Inicio con su desglose: el dominio va primero porque la promesa es que el alumno
 * aprenda, no solo que avance (ADR 025). En móvil, 2 × 2; desde tablet, una fila de 4.
 */
export function Kpis({ dominioMedio, dominio, avancePromedio, avance, estudiantes, porCurso, enRiesgo }: Props) {
  const maxCurso = Math.max(1, ...porCurso.map((c) => c.n));
  const bajos = enRiesgo.filter((a) => a.dominioBajo).length;
  const sinEntrar = enRiesgo.filter((a) => a.sinEntrar).length;
  return (
    <section aria-label="Resumen de tu academia" className="ci-kpis">
      <div className="ci-kpi ci-kpi--dest">
        <div className="ci-kpi__top">
          <h2 className="ci-kpi__label">Dominio medio</h2>
          <span className="ci-kpi__value">{dominioMedio === null ? "—" : `${dominioMedio} %`}</span>
        </div>
        {dominio.total > dominio.sinQuiz ? (
          <Distribucion
            nombre="Inscripciones según dominio"
            total={dominio.total}
            partes={[
              { label: "Bajo", n: dominio.bajo, tono: "bajo" },
              { label: "Medio", n: dominio.medio, tono: "prog" },
              { label: "Alto", n: dominio.alto, tono: "ok" },
              { label: "Sin quiz", n: dominio.sinQuiz, tono: "vacio" },
            ]}
          />
        ) : (
          <p className="ci-kpi__nota">Aparecerá cuando respondan un quiz.</p>
        )}
      </div>

      <div className="ci-kpi">
        <div className="ci-kpi__top">
          <h2 className="ci-kpi__label">Avance</h2>
          <span className="ci-kpi__value">{avancePromedio === null ? "—" : `${avancePromedio} %`}</span>
        </div>
        {avance.total > 0 ? (
          <Distribucion
            nombre="Inscripciones según avance"
            total={avance.total}
            partes={[
              { label: "En progreso", n: avance.enProgreso, tono: "prog" },
              { label: "Sin iniciar", n: avance.sinIniciar, tono: "vacio" },
              { label: "Terminaron", n: avance.terminaron, tono: "ok" },
            ]}
          />
        ) : (
          <p className="ci-kpi__nota">Aparecerá cuando alguien empiece.</p>
        )}
      </div>

      <div className="ci-kpi">
        <div className="ci-kpi__top">
          <h2 className="ci-kpi__label">Estudiantes activos</h2>
          <span className="ci-kpi__value">{estudiantes}</span>
        </div>
        {porCurso.length > 0 ? (
          <ul className="ci-porcurso" aria-label="Estudiantes por curso">
            {porCurso.slice(0, 3).map((c) => (
              <li key={c.cursoId}>
                <span className="ci-porcurso__fila">
                  <span className="ci-porcurso__nombre">{c.curso}</span>
                  <strong>{c.n}</strong>
                </span>
                <span className="ci-bar ci-bar--fina" aria-hidden="true">
                  <i style={{ width: `${(c.n / maxCurso) * 100}%` }} />
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="ci-kpi__nota">Aún no hay estudiantes con inscripción activa.</p>
        )}
      </div>

      <Link href="#ci-ayuda-t" className={`ci-kpi ci-kpi--link${enRiesgo.length > 0 ? " ci-kpi--alerta" : ""}`}>
        <div className="ci-kpi__top">
          <h2 className="ci-kpi__label">Necesitan ayuda</h2>
          <span className="ci-kpi__value">
            {enRiesgo.length}
            {estudiantes > 0 && <small> de {estudiantes}</small>}
          </span>
        </div>
        {enRiesgo.length > 0 ? (
          <>
            <span className="ci-avatares" aria-hidden="true">
              {enRiesgo.slice(0, 4).map((a) => (
                <span key={a.alumnoId}>{iniciales(a.alumno)}</span>
              ))}
            </span>
            <ul className="ci-leyenda ci-leyenda--plana">
              <li>
                <span>Dominio bajo</span>
                <strong>{bajos}</strong>
              </li>
              <li>
                <span>7+ días sin entrar</span>
                <strong>{sinEntrar}</strong>
              </li>
            </ul>
          </>
        ) : (
          <p className="ci-kpi__nota">Nadie se está quedando atrás.</p>
        )}
      </Link>
    </section>
  );
}
