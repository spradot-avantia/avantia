import "./inicio.css";

interface Props {
  /** Estudiantes con inscripción activa (o registrados si aún no hay inscripciones). */
  estudiantes: number;
  /** Dominio medio (0–100) de las inscripciones activas con quiz respondido; null si no hay. */
  dominioMedio: number | null;
  /** Promedio de avance de inscripciones activas (0–100), o null si no hay. */
  avancePromedio: number | null;
  /** Inscripciones activas con dominio bajo o sin entrar hace 7+ días. */
  necesitanAyuda: number;
}

function Kpi({
  valor,
  label,
  nota,
  destacado,
  alerta,
}: {
  valor: string | number;
  label: string;
  nota: string;
  destacado?: boolean;
  alerta?: boolean;
}) {
  return (
    <div className={`ci-kpis__item${destacado ? " ci-kpis__item--dest" : ""}${alerta ? " ci-kpis__item--alerta" : ""}`}>
      <span className="ci-kpi__label">{label}</span>
      <span className="ci-kpi__value">{valor}</span>
      <span className="ci-kpis__nota">{nota}</span>
    </div>
  );
}

/**
 * KPIs del Inicio: el dominio va primero porque la promesa es que el alumno aprenda, no solo
 * que avance (ADR 025). En móvil, 2 × 2; desde tablet, una fila de 4.
 */
export function Kpis({ estudiantes, dominioMedio, avancePromedio, necesitanAyuda }: Props) {
  return (
    <section aria-label="Resumen de tu academia" className="ci-card ci-kpis">
      <Kpi
        destacado
        valor={dominioMedio === null ? "—" : `${dominioMedio} %`}
        label="Dominio medio"
        nota={dominioMedio === null ? "Aparecerá cuando respondan un quiz" : "Lo que tus estudiantes ya saben"}
      />
      <Kpi
        valor={avancePromedio === null ? "—" : `${avancePromedio} %`}
        label="Avance"
        nota={avancePromedio === null ? "Aparecerá cuando alguien empiece" : "Lecciones completadas, en promedio"}
      />
      <Kpi valor={estudiantes} label="Estudiantes" nota={estudiantes > 0 ? "Con inscripción activa" : "Aún no hay estudiantes"} />
      <Kpi
        alerta={necesitanAyuda > 0}
        valor={necesitanAyuda}
        label="Necesitan ayuda"
        nota={necesitanAyuda > 0 ? "Dominio bajo o sin entrar" : "Nadie se está quedando atrás"}
      />
    </section>
  );
}
