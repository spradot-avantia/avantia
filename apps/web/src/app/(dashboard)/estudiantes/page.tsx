import { EmptyState, LinkButton, PageHeader, SinAcademia } from "../../../components/creador";
import { InscripcionesAlumnos } from "../../../components/creador/estudiantes/InscripcionesAlumnos";
import { ListaEstudiantes, type FilaEstudiante } from "../../../components/creador/estudiantes/ListaEstudiantes";
import { RegistrarEstudiantes, type CursoOpcion } from "../../../components/creador/estudiantes/RegistrarEstudiantes";
import "../../../components/creador/inicio/inicio.css";
import { listarCursos } from "../../../lib/creador/cursos";
import { listarEstudiantes } from "../../../lib/creador/estudiantes";
import { listarInscripciones, type FilaInscripcion } from "../../../lib/creador/inscripciones";
import { urlPublicaCurso } from "../../../lib/creador/publicacion";
import { getCurrentTenant } from "../../../lib/creador/tenantActual";

export const dynamic = "force-dynamic";

export default async function EstudiantesPage({ searchParams }: { searchParams: { curso?: string; ver?: string } }) {
  let opciones: CursoOpcion[];
  let filas: FilaEstudiante[];
  let inscripciones: FilaInscripcion[];
  try {
    const tenant = await getCurrentTenant();
    if (!tenant) return <SinAcademia />;
    const [cursos, inv, insc] = await Promise.all([listarCursos(), listarEstudiantes(), listarInscripciones()]);
    // Publicados primero: son los que ya se pueden compartir.
    opciones = [...cursos]
      .sort((a, b) => Number(b.estado === "publicado") - Number(a.estado === "publicado"))
      .map((c) => ({ id: c.id, titulo: c.titulo, estado: c.estado, acceso: c.acceso, url: urlPublicaCurso(tenant, c.slug) }));
    const titulos = new Map(cursos.map((c) => [c.id, c.titulo]));
    // Una invitación cuyo correo ya tiene inscripción activa en ese curso cuenta como "ya entró"
    // (la invitación misma queda «pendiente» en la base hasta que se marque como aceptada).
    const yaEntro = new Set(insc.filter((x) => x.estado === "activa").map((x) => `${x.cursoId}:${x.correo.toLowerCase()}`));
    filas = inv.map((i) => ({
      id: i.id,
      email: i.email,
      cursoTitulo: titulos.get(i.cursoId) ?? "Curso",
      estado: i.estado === "pendiente" && yaEntro.has(`${i.cursoId}:${i.email.toLowerCase()}`) ? "aceptada" : i.estado,
    }));
    inscripciones = insc;
  } catch (e) {
    console.error("[estudiantes] no se pudo cargar", e);
    return (
      <EmptyState titulo="No pudimos cargar a tus estudiantes" descripcion="Revisa tu conexión e inténtalo de nuevo en unos minutos." />
    );
  }

  const inicial = opciones.find((o) => o.id === searchParams.curso)?.id ?? opciones[0]?.id;

  return (
    <div className="ci-stack">
      <PageHeader
        titulo="Estudiantes"
        descripcion="Todas las personas crean su cuenta. Las que invitas entran activas al confirmar su correo; las que llegan por anuncios o tu página esperan a que actives su inscripción."
      />
      {opciones.length === 0 ? (
        <EmptyState
          titulo="Primero crea un curso"
          descripcion="Los estudiantes se registran dentro de un curso. Crea el tuyo y vuelve aquí."
          accion={<LinkButton href="/cursos/nuevo">Crear curso</LinkButton>}
        />
      ) : (
        <>
          <InscripcionesAlumnos inscripciones={inscripciones} vistaInicial={searchParams.ver === "por-activar" ? "por-activar" : undefined} />
          <RegistrarEstudiantes cursos={opciones} cursoInicial={inicial} />
          <section className="ci-stack" style={{ gap: "var(--av-space-3)" }} aria-labelledby="ci-reg-t">
            <h2 className="ci-card__title" id="ci-reg-t">
              Invitados ({filas.length})
            </h2>
            {filas.length === 0 ? (
              <EmptyState titulo="Aún no registras invitados" descripcion="Pega sus correos arriba y aparecerán aquí." />
            ) : (
              <ListaEstudiantes filas={filas} />
            )}
          </section>
        </>
      )}
    </div>
  );
}
