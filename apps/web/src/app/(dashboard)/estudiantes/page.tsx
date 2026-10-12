import { EmptyState, LinkButton, PageHeader, SinAcademia } from "../../../components/creador";
import { ListaEstudiantes, type FilaEstudiante } from "../../../components/creador/estudiantes/ListaEstudiantes";
import { RegistrarEstudiantes, type CursoOpcion } from "../../../components/creador/estudiantes/RegistrarEstudiantes";
import "../../../components/creador/inicio/inicio.css";
import { listarCursos } from "../../../lib/creador/cursos";
import { listarEstudiantes } from "../../../lib/creador/estudiantes";
import { urlPublicaCurso } from "../../../lib/creador/publicacion";
import { getCurrentTenant } from "../../../lib/creador/tenantActual";

export const dynamic = "force-dynamic";

export default async function EstudiantesPage({ searchParams }: { searchParams: { curso?: string } }) {
  let opciones: CursoOpcion[];
  let filas: FilaEstudiante[];
  try {
    const tenant = await getCurrentTenant();
    if (!tenant) return <SinAcademia />;
    const [cursos, inv] = await Promise.all([listarCursos(), listarEstudiantes()]);
    // Publicados primero: son los que ya se pueden compartir.
    opciones = [...cursos]
      .sort((a, b) => Number(b.estado === "publicado") - Number(a.estado === "publicado"))
      .map((c) => ({ id: c.id, titulo: c.titulo, estado: c.estado, acceso: c.acceso, url: urlPublicaCurso(tenant, c.slug) }));
    const titulos = new Map(cursos.map((c) => [c.id, c.titulo]));
    filas = inv.map((i) => ({ id: i.id, email: i.email, cursoTitulo: titulos.get(i.cursoId) ?? "Curso", estado: i.estado }));
  } catch (e) {
    console.error("[estudiantes] no se pudo cargar", e);
    return (
      <EmptyState titulo="No pudimos cargar a tus estudiantes" descripcion="Revisa tu conexión e inténtalo de nuevo en unos minutos." />
    );
  }

  const inicial = opciones.find((o) => o.id === searchParams.curso)?.id ?? opciones[0]?.id;

  return (
    <div className="ci-stack">
      <PageHeader titulo="Estudiantes" descripcion="Registra a las personas de tu piloto para llevar su seguimiento." />
      {opciones.length === 0 ? (
        <EmptyState
          titulo="Primero crea un curso"
          descripcion="Los estudiantes se registran dentro de un curso. Crea el tuyo y vuelve aquí."
          accion={<LinkButton href="/cursos/nuevo">Crear curso</LinkButton>}
        />
      ) : (
        <>
          <RegistrarEstudiantes cursos={opciones} cursoInicial={inicial} />
          <section className="ci-stack" style={{ gap: "var(--av-space-3)" }} aria-labelledby="ci-reg-t">
            <h2 className="ci-card__title" id="ci-reg-t">
              Registrados ({filas.length})
            </h2>
            {filas.length === 0 ? (
              <EmptyState titulo="Aún no registras estudiantes" descripcion="Pega sus correos arriba y aparecerán aquí." />
            ) : (
              <ListaEstudiantes filas={filas} />
            )}
          </section>
        </>
      )}
    </div>
  );
}
