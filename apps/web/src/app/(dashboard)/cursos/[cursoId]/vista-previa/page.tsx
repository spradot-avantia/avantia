import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState, LinkButton, SinAcademia } from "../../../../../components/creador";
import { FichaCurso } from "../../../../../components/tenant/FichaCurso";
import { cargarCursoParaEditor } from "../../../../../lib/creador/editorData";
import "../../../../../components/creador/creador.css";
import "../../../../../components/creador/editor/editor.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Vista previa del curso" };

export default async function VistaPreviaPage({
  params,
  searchParams,
}: {
  params: { cursoId: string };
  searchParams: { modo?: string | string[] };
}) {
  const carga = await cargarCursoParaEditor(params.cursoId);
  if (carga.estado === "no_encontrado") notFound();
  if (carga.estado === "sin_academia") return <SinAcademia />;
  if (carga.estado === "error") {
    return (
      <EmptyState
        titulo="No pudimos cargar la vista previa"
        descripcion="Inténtalo de nuevo en unos minutos."
        accion={<LinkButton href="/cursos">Volver a Cursos</LinkButton>}
      />
    );
  }

  const { curso, tenant } = carga;
  const modoParam = Array.isArray(searchParams.modo) ? searchParams.modo[0] : searchParams.modo;
  const movil = modoParam === "movil";
  const base = `/cursos/${curso.id}/vista-previa`;

  return (
    <div className="av-scope vp">
      <Link href={`/cursos/${curso.id}/editar?paso=revisar`} className="cr-back">
        ← Volver a revisar
      </Link>
      <div className="vp-barra">
        <div>
          <h1 className="ed-head__title">Vista previa del curso</h1>
          <p className="vp-aviso">Así verán tu curso tus estudiantes. Los botones están desactivados en la vista previa.</p>
        </div>
        <nav aria-label="Tamaño de la vista previa" className="vp-modos">
          <Link href={`${base}?modo=escritorio`} aria-current={movil ? undefined : "page"}>
            Escritorio
          </Link>
          <Link href={`${base}?modo=movil`} aria-current={movil ? "page" : undefined}>
            Móvil
          </Link>
        </nav>
      </div>
      <div className={`vp-marco${movil ? " vp-marco--movil" : ""}`}>
        <FichaCurso tenant={tenant} curso={curso} preview />
      </div>
    </div>
  );
}
