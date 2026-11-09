import Link from "next/link";
import { Badge, EmptyState, PageHeader, SinAcademia } from "../../../components/creador";
import "../../../components/creador/inicio/inicio.css";
import "../../../components/creador/tareas/tareas.css";
import { listarRevisiones, type EstadoRevision, type FilaRevision } from "../../../lib/creador/tareas";
import { getCurrentTenant } from "../../../lib/creador/tenantActual";
import { fechaHoraLarga, formatearPuntaje } from "../../../lib/tareas/reglas";

export const dynamic = "force-dynamic";
export const metadata = { title: "Revisiones" };

const ETIQUETA: Record<EstadoRevision, { texto: string; tono: "warning" | "info" | "ok" }> = {
  por_revisar: { texto: "Por revisar", tono: "warning" },
  borrador: { texto: "Borrador", tono: "info" },
  publicada: { texto: "Publicada", tono: "ok" },
};

export default async function RevisionesPage() {
  let filas: FilaRevision[];
  try {
    const tenant = await getCurrentTenant();
    if (!tenant) return <SinAcademia />;
    filas = await listarRevisiones();
  } catch (e) {
    console.error("[revisiones] no se pudo cargar", e);
    return <EmptyState titulo="No pudimos cargar las entregas" descripcion="Revisa tu conexión e inténtalo de nuevo en unos minutos." />;
  }
  const pendientes = filas.filter((f) => f.estado === "por_revisar").length;

  return (
    <div className="ci-stack">
      <PageHeader
        titulo="Revisiones"
        descripcion={
          pendientes > 0
            ? `${pendientes} ${pendientes === 1 ? "entrega espera" : "entregas esperan"} tu revisión.`
            : "Aquí llegan las tareas que tus estudiantes entregan."
        }
      />
      {filas.length === 0 ? (
        <EmptyState
          titulo="Aún no hay entregas"
          descripcion="Crea una tarea dentro de una lección (sección «Tarea con entrega») y, cuando tus estudiantes la envíen, la verás aquí."
        />
      ) : (
        <ul className="ci-list">
          {filas.map((f) => {
            const et = ETIQUETA[f.estado];
            return (
              <li key={f.entregaId} className="ci-row">
                <div className="ci-row__main tr-clase">
                  <span className="ci-row__title">
                    {f.alumnoNombre} · {f.tareaTitulo}
                  </span>
                  <span className="tr-clase__meta">
                    <span>{f.cursoTitulo}</span>
                    <span>
                      Entrega {f.numero}, {fechaHoraLarga(f.enviadaAt)}
                    </span>
                    {f.atrasada && <Badge tono="warning">Atrasada</Badge>}
                    {f.puntaje !== null && (
                      <span>
                        {formatearPuntaje(f.puntaje)} de {formatearPuntaje(f.puntajeMaximo)}
                      </span>
                    )}
                    <Badge tono={et.tono}>{et.texto}</Badge>
                  </span>
                </div>
                <Link href={`/revisiones/${f.entregaId}`} className="av-btn cr-btn av-btn--secondary">
                  {f.estado === "por_revisar" ? "Revisar" : "Abrir"}
                  <span className="av-sr-only">
                    {" "}
                    la entrega de {f.alumnoNombre}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
