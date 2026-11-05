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
    <div className="ci-kpis__item">
      <span className="ci-kpi__label">{label}</span>
      <span className="ci-kpi__value">{valor}</span>
      <span className="ci-kpis__nota">{nota}</span>
    </div>
  );
}

/** KPIs: solo los calculables hoy. En móvil, una franja de 3 cifras; la nota aparece desde tablet. */
export function Kpis({ publicados, borradores, estudiantes, avancePromedio }: Props) {
  return (
    <section aria-label="Resumen" className="ci-card ci-kpis">
      <Kpi
        valor={publicados}
        label="Publicados"
        nota={borradores > 0 ? `${borradores} ${borradores === 1 ? "borrador" : "borradores"}` : "Sin borradores"}
      />
      <Kpi valor={estudiantes} label="Estudiantes" nota={estudiantes > 0 ? "En todos tus cursos" : "Aún no registras estudiantes"} />
      <Kpi
        valor={avancePromedio === null ? "—" : `${avancePromedio} %`}
        label="Avance"
        nota={avancePromedio === null ? "Aparecerá cuando alguien empiece un curso" : "Promedio de inscripciones activas"}
      />
    </section>
  );
}
