import { EmptyState, LinkButton, PageHeader, SinAcademia } from "../../../components/creador";
import { InscripcionesAlumnos } from "../../../components/creador/estudiantes/InscripcionesAlumnos";
import { ListaEstudiantes, type FilaEstudiante } from "../../../components/creador/estudiantes/ListaEstudiantes";
import { ResultadosQuiz } from "../../../components/creador/estudiantes/ResultadosQuiz";
import { RegistrarEstudiantes, type CursoOpcion } from "../../../components/creador/estudiantes/RegistrarEstudiantes";
import "../../../components/creador/inicio/inicio.css";
import { listarCursos } from "../../../lib/creador/cursos";
import { listarEstudiantes } from "../../../lib/creador/estudiantes";
import { listarInscripciones, type FilaInscripcion } from "../../../lib/creador/inscripciones";
import { resultadosDelQuiz, type ResultadoModulo } from "../../../lib/creador/resultadosQuiz";
import { urlPublicaCurso } from "../../../lib/creador/publicacion";
import { getCurrentTenant } from "../../../lib/creador/tenantActual";

export const dynamic = "force-dynamic";

export default async function EstudiantesPage({ searchParams }: { searchParams: { curso?: string; ver?: string } }) {
  let opciones: CursoOpcion[];
  let filas: FilaEstudiante[];
  let inscripciones: FilaInscripcion[];
  let quiz: ResultadoModulo[] = [];
  let titulosCurso = new Map<string, string>();
  try {
    const tenant = await getCurrentTenant();
    if (!tenant) return <SinAcademia />;
    const [cursos, inv, insc] = await Promise.all([listarCursos(), listarEstudiantes(), listarInscripciones()]);
    // Publicados primero: son los que ya se pueden compartir.
    opciones = [...cursos]
      .sort((a, b) => Number(b.estado === "publicado") - Number(a.estado === "publicado"))
      .map((c) => ({ id: c.id, titulo: c.titulo, estado: c.estado, acceso: c.acceso, url: urlPublicaCurso(tenant, c.slug) }));
    const titulos = new Map(cursos.map((c) => [c.id, c.titulo]));
    // Quien ya tiene inscripción (en cualquier estado) aparece en la lista de estudiantes de arriba:
    // «Invitados» muestra solo las invitaciones que aún no crearon su cuenta, para no repetir a nadie.
    const conInscripcion = new Set(insc.map((x) => `${x.cursoId}:${x.correo.toLowerCase()}`));
    filas = inv
      .filter((i) => !conInscripcion.has(`${i.cursoId}:${i.email.toLowerCase()}`))
      .map((i) => ({
        id: i.id,
        email: i.email,
        cursoTitulo: titulos.get(i.cursoId) ?? "Curso",
        estado: i.estado,
      }));
    inscripciones = insc;
    titulosCurso = titulos;
    quiz = await resultadosDelQuiz().catch(() => []);
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
          <details className="ci-det" open={inscripciones.length === 0 && filas.length === 0}>
            <summary>Registrar estudiantes por correo</summary>
            <RegistrarEstudiantes cursos={opciones} cursoInicial={inicial} />
          </details>
          <InscripcionesAlumnos inscripciones={inscripciones} vistaInicial={searchParams.ver === "por-activar" ? "por-activar" : undefined} />
          {filas.length > 0 && (
            <section className="ci-stack" style={{ gap: "var(--av-space-3)" }} aria-labelledby="ci-reg-t">
              <h2 className="ci-card__title" id="ci-reg-t">
                Invitados que aún no crean su cuenta ({filas.length})
              </h2>
              <ListaEstudiantes filas={filas} />
            </section>
          )}
          <ResultadosQuiz resultados={quiz} titulosCurso={titulosCurso} />
        </>
      )}
    </div>
  );
}
