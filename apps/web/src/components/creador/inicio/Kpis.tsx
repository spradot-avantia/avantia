import "./inicio.css";

interface Props {
  publicados: number;
  borradores: number;
  estudiantes: number;
  /** Promedio de avance de inscripciones activas (0–100), o null si no hay. */
  avancePromedio: number | null;
}

function Kpi({ valor, label, nota }: { valor: string | number; label: string; nota: string }) {
  return (
    <div className="ci-card">
      <span className="ci-kpi__label">{label}</span>
      <span className="ci-kpi__value">{valor}</span>
      <span className="ci-muted">{nota}</span>
    </div>
  );
}

/** KPIs: solo los calculables hoy; el resto, estado vacio honesto. */
export function Kpis({ publicados, borradores, estudiantes, avancePromedio }: Props) {
  return (
    <section aria-label="Resumen" className="ci-grid ci-grid--kpi">
      <Kpi
        valor={publicados}
        label="Cursos publicados"
        nota={borradores > 0 ? `${borradores} ${borradores === 1 ? "borrador" : "borradores"}` : "Sin borradores"}
      />
      <Kpi
        valor={estudiantes}
        label="Estudiantes registrados"
        nota={estudiantes > 0 ? "En todos tus cursos" : "Aún no registras estudiantes"}
      />
      <Kpi
        valor={avancePromedio === null ? "—" : `${avancePromedio} %`}
        label="Avance de estudiantes"
        nota={avancePromedio === null ? (estudiantes > 0 ? "Aparecerá cuando alguien empiece un curso." : "Aparecerá cuando tengas estudiantes.") : "Promedio de inscripciones activas"}
      />
    </section>
  );
}
