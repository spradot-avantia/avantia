import Link from "next/link";
import { EmptyState } from "../../../../components/creador";
import "../../../../components/creador/analitica/analitica.css";
import { cargarAnaliticaCreadores } from "../../../../lib/admin/analiticaCreadores";
import { diasDesde, estancada, etapaDe, ETAPAS } from "../../../../lib/admin/embudoReglas";

export const dynamic = "force-dynamic";

const fecha = new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeZone: "America/Santiago" });

function hace(dias: number | null): string {
  if (dias === null) return "nunca";
  if (dias === 0) return "hoy";
  return dias === 1 ? "hace 1 día" : `hace ${dias} días`;
}

export default async function AdminAnaliticaPage({ searchParams }: { searchParams: { etapa?: string; estancadas?: string } }) {
  let d: Awaited<ReturnType<typeof cargarAnaliticaCreadores>>;
  try {
    d = await cargarAnaliticaCreadores();
  } catch (e) {
    console.error("[admin/analitica] no se pudo cargar", e);
    return <EmptyState titulo="No pudimos cargar la analítica" descripcion="Inténtalo de nuevo en unos minutos." />;
  }
  const soloEstancadas = searchParams.estancadas === "1";
  const etapa = ETAPAS.find((e) => e.id === searchParams.etapa)?.id;
  const filas = d.academias.filter((a) => (!etapa || etapaDe(a).id === etapa) && (!soloEstancadas || estancada(a, d.ahora)));
  const max = Math.max(1, ...d.embudo.map((f) => f.cantidad));
  const m = d.medianas;
  const dias = (n: number | null) => (n === null ? "sin datos" : `${n} d`);

  return (
    <>
      <h1 className="ad-h1">Analítica de creadores</h1>
      <p className="ad-lede">Cómo avanzan las academias en la cascada de creación, quién está activo y quién se estancó.</p>

      <section className="ad-stats" aria-label="Resumen">
        <div className="ad-stat"><strong>{d.kpis.academias}</strong><span>Academias</span></div>
        <div className="ad-stat"><strong>{d.kpis.conPublicado}</strong><span>Con un curso publicado</span></div>
        <div className="ad-stat"><strong>{d.kpis.alumnos}</strong><span>Alumnos activos en total</span></div>
        <div className="ad-stat"><strong>{d.kpis.estancadas}</strong><span>Estancadas (14 días o más)</span></div>
      </section>

      <h2 className="ad-row__title">Cascada de creación</h2>
      <p className="ad-row__sub">Academias que alcanzaron al menos cada etapa, en orden. El porcentaje es el paso desde la etapa anterior.</p>
      <ol className="an-lista" style={{ margin: "var(--av-space-3) 0 var(--av-space-4)" }}>
        {d.embudo.map((f) => (
          <li key={f.id} className="an-fila">
            <span className="an-fila__t">{f.label}</span>
            <div className="an-barra" aria-hidden="true"><i style={{ width: `${Math.round((f.cantidad / max) * 100)}%` }} /></div>
            <span className="an-fila__meta">
              <span>{f.cantidad} {f.cantidad === 1 ? "academia" : "academias"}</span>
              {f.pasoPct !== null && <span>{f.pasoPct} % de la etapa anterior</span>}
            </span>
          </li>
        ))}
      </ol>
      <p className="ad-row__sub">
        Tiempo mediano desde que se crea la academia: primer curso {dias(m.primerCurso)} · publicado {dias(m.publicado)} · primer alumno {dias(m.primerAlumno)} · primer pago {dias(m.primerPago)}.
      </p>

      <h2 className="ad-row__title" style={{ marginTop: "var(--av-space-5)" }}>Academias</h2>
      <nav className="ad-filters" aria-label="Filtrar por etapa">
        <Link href="/admin/analitica" className="ad-chip" aria-current={!etapa && !soloEstancadas}>Todas ({d.academias.length})</Link>
        <Link href="/admin/analitica?estancadas=1" className="ad-chip" aria-current={soloEstancadas}>Estancadas ({d.kpis.estancadas})</Link>
        {ETAPAS.map((e) => (
          <Link key={e.id} href={`/admin/analitica?etapa=${e.id}`} className="ad-chip" aria-current={etapa === e.id}>
            {e.label}
          </Link>
        ))}
      </nav>

      {filas.length === 0 ? (
        <p className="ad-empty">No hay academias con ese filtro.</p>
      ) : (
        <div className="an-scroll">
          <table className="an-tabla">
            <thead>
              <tr>
                <th>Academia</th>
                <th>Etapa</th>
                <th>Último ingreso</th>
                <th>Última edición</th>
                <th>Cursos pub./total</th>
                <th>Alumnos</th>
                <th>Activos 30 d</th>
                <th>Alta</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((a) => (
                <tr key={a.tenantId}>
                  <td>
                    <strong>{a.nombre}</strong>
                    <div className="ad-row__sub">{a.dueno}</div>
                  </td>
                  <td>{etapaDe(a).label}{estancada(a, d.ahora) ? " · estancada" : ""}</td>
                  <td>{hace(diasDesde(a.ultimoLogin, d.ahora))}</td>
                  <td>{hace(diasDesde(a.ultimaEdicion, d.ahora))}</td>
                  <td>{a.cursosPublicados}/{a.cursosTotal}</td>
                  <td>{a.alumnos}</td>
                  <td>{a.alumnosActivos30}</td>
                  <td>{fecha.format(new Date(a.creadaAt))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="ad-row__sub" style={{ marginTop: "var(--av-space-4)" }}>
        «Último ingreso» es el último inicio de sesión del dueño; una sesión larga no lo actualiza, por eso se muestra junto a la última edición real (curso, módulo, lección, academia o página).{" "}
        <a href="/admin/analitica/exportar">Descargar CSV</a>
      </p>
    </>
  );
}
