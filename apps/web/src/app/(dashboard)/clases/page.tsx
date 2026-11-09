import { EmptyState, PageHeader, SinAcademia } from "../../../components/creador";
import { GestorClases } from "../../../components/creador/tareas/GestorClases";
import { listarClases, type ClaseCreador } from "../../../lib/creador/clases";
import { listarCursos } from "../../../lib/creador/cursos";
import { getCurrentTenant } from "../../../lib/creador/tenantActual";

export const dynamic = "force-dynamic";
export const metadata = { title: "Clases en vivo" };

export default async function ClasesPage() {
  let cursos: Array<{ id: string; titulo: string }>;
  let clases: ClaseCreador[];
  try {
    const tenant = await getCurrentTenant();
    if (!tenant) return <SinAcademia />;
    const [cs, cl] = await Promise.all([listarCursos(), listarClases()]);
    cursos = cs.map((c) => ({ id: c.id, titulo: c.titulo }));
    clases = cl;
  } catch (e) {
    console.error("[clases] no se pudo cargar", e);
    return <EmptyState titulo="No pudimos cargar tus clases" descripcion="Revisa tu conexión e inténtalo de nuevo en unos minutos." />;
  }
  return (
    <div className="ci-stack">
      <PageHeader
        titulo="Clases en vivo"
        descripcion="Agenda la clase, pega el enlace de Meet y, al terminar, deja la grabación y lo que se vio. Tus estudiantes lo ven en el curso."
      />
      <GestorClases cursos={cursos} clasesIniciales={clases} />
    </div>
  );
}
