import { EmptyState, LinkButton, PageHeader, SinAcademia } from "../../../components/creador";
import { ListaCursos, type CursoConUrl } from "../../../components/creador/cursos/ListaCursos";
import "../../../components/creador/inicio/inicio.css";
import { listarCursos } from "../../../lib/creador/cursos";
import { urlPublicaCurso } from "../../../lib/creador/publicacion";
import { getCurrentTenant } from "../../../lib/creador/tenantActual";

export const dynamic = "force-dynamic";

export default async function CursosPage() {
  let cursos: CursoConUrl[];
  try {
    const tenant = await getCurrentTenant();
    if (!tenant) return <SinAcademia />;
    cursos = (await listarCursos()).map((c) => ({ ...c, url: urlPublicaCurso(tenant, c.slug) }));
  } catch (e) {
    console.error("[cursos] no se pudo cargar", e);
    return <EmptyState titulo="No pudimos cargar tus cursos" descripcion="Revisa tu conexión e inténtalo de nuevo en unos minutos." />;
  }

  return (
    <div className="ci-stack">
      <PageHeader
        titulo="Cursos"
        descripcion="Crea, edita y comparte los cursos de tu academia."
        acciones={cursos.length > 0 ? <LinkButton href="/cursos/nuevo">Crear curso</LinkButton> : undefined}
      />
      {cursos.length === 0 ? (
        <EmptyState
          titulo="Aún no tienes cursos"
          descripcion="Crea tu primer curso con una estructura sugerida o desde cero. El borrador se guarda solo."
          accion={<LinkButton href="/cursos/nuevo">Crear curso</LinkButton>}
        />
      ) : (
        <ListaCursos cursos={cursos} />
      )}
    </div>
  );
}
