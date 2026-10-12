import "./inicio.css";

interface Props {
  publicados: number;
  borradores: number;
  estudiantes: number;
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
export function Kpis({ publicados, borradores, estudiantes }: Props) {
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
      <div className="ci-card">
        <span className="ci-kpi__label">Avance de estudiantes</span>
        <span className="ci-card__title">Sin datos todavía</span>
        <span className="ci-muted">
          {estudiantes > 0 ? "Se medirá cuando conectemos la experiencia del estudiante." : "Aparecerá cuando tengas estudiantes."}
        </span>
      </div>
      <div className="ci-card ci-card--soon" aria-disabled="true">
        <span className="ci-kpi__label">Próximas sesiones en vivo</span>
        <span className="ci-card__title">Próximamente</span>
        <span className="ci-muted">Programar encuentros por videollamada aún no está disponible.</span>
      </div>
    </section>
  );
}
