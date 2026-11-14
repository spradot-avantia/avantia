import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, EmptyState, LinkButton, PageHeader, SinAcademia } from "../../../../components/creador";
import { RevisionForm } from "../../../../components/creador/tareas/RevisionForm";
import "../../../../components/creador/inicio/inicio.css";
import "../../../../components/creador/tareas/tareas.css";
import { MarkdownMinimo } from "../../../../components/tenant/MarkdownMinimo";
import { detalleDeRevision, type DetalleRevision } from "../../../../lib/creador/tareas";
import { getCurrentTenant } from "../../../../lib/creador/tenantActual";
import { formatearBytes } from "../../../../lib/creador/archivosReglas";
import { fechaHoraLarga, formatearPuntaje } from "../../../../lib/tareas/reglas";

export const dynamic = "force-dynamic";
export const metadata = { title: "Revisar entrega" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function RevisarEntregaPage({ params }: { params: { entregaId: string } }) {
  if (!UUID.test(params.entregaId)) notFound();
  let d: DetalleRevision | null;
  try {
    const tenant = await getCurrentTenant();
    if (!tenant) return <SinAcademia />;
    d = await detalleDeRevision(params.entregaId);
  } catch (e) {
    console.error("[revisiones] no se pudo cargar la entrega", e);
    return <EmptyState titulo="No pudimos abrir la entrega" descripcion="Inténtalo de nuevo en unos minutos." accion={<LinkButton href="/revisiones">Volver</LinkButton>} />;
  }
  if (!d) notFound();
  const { entrega, tarea, alumno, historial, revision } = d;

  return (
    <div className="ci-stack">
      <PageHeader
        volver={{ href: "/revisiones", label: "Revisiones" }}
        titulo={`${alumno.nombre}: ${tarea.titulo}`}
        descripcion={`${tarea.cursoTitulo} · ${alumno.correo}`}
      />
      <div className="tr-split">
        <section className="tr-panel" aria-labelledby="rv-entrega">
          <h2 id="rv-entrega">Entrega {entrega.numero}</h2>
          <p className="tr-clase__meta">
            <span>{fechaHoraLarga(entrega.enviadaAt)}</span>
            {entrega.atrasada && <Badge tono="warning">Atrasada</Badge>}
          </p>
          <div className="tr-actions">
            <a className="av-btn cr-btn av-btn--primary" href={`/revisiones/${entrega.id}/archivo`} target="_blank" rel="noopener noreferrer">
              Abrir {entrega.archivoNombre}
            </a>
            <span className="tr-hint">{formatearBytes(entrega.bytes)}</span>
          </div>
          {entrega.comentarioAlumno && (
            <>
              <h3>Mensaje del alumno</h3>
              <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{entrega.comentarioAlumno}</p>
            </>
          )}
          {historial.length > 1 && (
            <>
              <h3>Todas sus entregas</h3>
              <ul className="tr-hist">
                {historial.map((h) => (
                  <li key={h.id}>
                    {h.id === entrega.id ? (
                      <strong>Entrega {h.numero} (esta)</strong>
                    ) : (
                      <Link href={`/revisiones/${h.id}`}>Entrega {h.numero}</Link>
                    )}{" "}
                    · {fechaHoraLarga(h.enviadaAt)}
                    {h.puntaje !== null && ` · ${formatearPuntaje(h.puntaje)} de ${formatearPuntaje(tarea.puntajeMaximo)}`}
                  </li>
                ))}
              </ul>
            </>
          )}
          {tarea.instrucciones && (
            <details>
              <summary className="tr-sum">Instrucciones de la tarea</summary>
              <MarkdownMinimo texto={tarea.instrucciones} />
            </details>
          )}
        </section>
        <section className="tr-panel" aria-labelledby="rv-revision">
          <h2 id="rv-revision">Tu revisión</h2>
          <RevisionForm key={entrega.id} entregaId={entrega.id} puntajeMaximo={tarea.puntajeMaximo} inicial={revision} />
        </section>
      </div>
    </div>
  );
}
