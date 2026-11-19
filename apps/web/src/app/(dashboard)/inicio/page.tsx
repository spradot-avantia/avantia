import type { ReactNode } from "react";
import { EmptyState, LinkButton, PageHeader, SinAcademia } from "../../../components/creador";
import { ListaCursos, type CursoConUrl } from "../../../components/creador/cursos/ListaCursos";
import { Checklist, type PasoChecklist } from "../../../components/creador/inicio/Checklist";
import { CopiarEnlace } from "../../../components/creador/inicio/CopiarEnlace";
import { ActividadReciente } from "../../../components/creador/inicio/ActividadReciente";
import { NecesitanAyuda, TemasDificiles } from "../../../components/creador/inicio/Atencion";
import { Kpis } from "../../../components/creador/inicio/Kpis";
import "../../../components/creador/inicio/inicio.css";
import { cargarActividadReciente, cargarTemasDificiles } from "../../../lib/creador/actividadReciente";
import { dominioMedio, necesitanAyuda } from "../../../lib/creador/actividadReglas";
import { listarCursos } from "../../../lib/creador/cursos";
import { listarEstudiantes } from "../../../lib/creador/estudiantes";
import { listarInscripciones } from "../../../lib/creador/inscripciones";
import { urlPublicaCurso } from "../../../lib/creador/publicacion";
import { getCurrentTenant } from "../../../lib/creador/tenantActual";
import type { CursoResumen, Invitacion, TenantCreador } from "../../../lib/creador/types";

export const dynamic = "force-dynamic";

async function cargar() {
  const tenant = await getCurrentTenant();
  if (!tenant)
    return {
      tenant: null as TenantCreador | null,
      cursos: [] as CursoResumen[],
      inv: [] as Invitacion[],
      inscripciones: [] as Awaited<ReturnType<typeof listarInscripciones>>,
      actividad: [] as Awaited<ReturnType<typeof cargarActividadReciente>>,
      temas: [] as Awaited<ReturnType<typeof cargarTemasDificiles>>,
    };
  // Lo secundario (dominio, actividad, temas) no tumba el Inicio si falla: se muestra vacío.
  const [cursos, inv, inscripciones, actividad, temas] = await Promise.all([
    listarCursos(),
    listarEstudiantes(),
    listarInscripciones().catch(() => []),
    cargarActividadReciente().catch((e) => {
      console.error("[inicio] actividad", e);
      return [];
    }),
    cargarTemasDificiles().catch(() => []),
  ]);
  return { tenant, cursos, inv, inscripciones, actividad, temas };
}

export default async function InicioPage() {
  let datos: Awaited<ReturnType<typeof cargar>>;
  try {
    datos = await cargar();
  } catch (e) {
    console.error("[inicio] no se pudo cargar", e);
    return <EmptyState titulo="No pudimos cargar tu inicio" descripcion="Revisa tu conexión e inténtalo de nuevo en unos minutos." />;
  }
  const { tenant, cursos, inv, inscripciones, actividad, temas } = datos;
  const activas = inscripciones.filter((i) => i.estado === "activa");
  const avancePromedio = activas.length ? Math.round(activas.reduce((t, i) => t + i.avance, 0) / activas.length) : null;
  if (!tenant) return <SinAcademia />;
  const dominio = dominioMedio(inscripciones);
  const enRiesgo = necesitanAyuda(inscripciones);
  const alumnosActivos = new Set(activas.map((i) => i.alumnoId)).size;
  const ahora = Date.now();

  const publicados = cursos.filter((c) => c.estado === "publicado");
  const borradores = cursos.filter((c) => c.estado === "borrador");
  // Invitados o inscritos (por enlace o pago): una invitación aceptada también es una
  // inscripción, así que se toma el mayor para no contar dos veces a la misma persona.
  const invitados = new Set(inv.filter((i) => i.estado !== "revocada").map((i) => i.email)).size;
  const inscritos = new Set(inscripciones.filter((i) => i.estado === "pendiente" || i.estado === "activa").map((i) => i.alumnoId)).size;
  const estudiantes = Math.max(invitados, inscritos);
  const primerPublicado = publicados[publicados.length - 1] ?? null; // el publicado mas antiguo
  const borrador = borradores[0] ?? null;
  const urlPublicado = primerPublicado ? urlPublicaCurso(tenant, primerPublicado.slug) : null;

  const pasos: PasoChecklist[] = [
    {
      titulo: "Configurar tu academia",
      detalle: "Nombre, color y logo.",
      hecho: tenant.onboardingCompletado,
      accion: { href: "/onboarding", label: "Configurar" },
    },
    {
      titulo: "Crear tu primer curso",
      detalle: "Con una estructura sugerida o desde cero.",
      hecho: cursos.length > 0,
      accion: { href: "/cursos/nuevo", label: "Empezar" },
    },
    {
      titulo: "Publicar tu primer curso",
      detalle: borrador ? "Revisa tu borrador y publícalo." : "Disponible cuando tengas un borrador.",
      hecho: publicados.length > 0,
      bloqueado: !borrador,
      accion: borrador ? { href: `/cursos/${borrador.id}/editar`, label: "Continuar" } : undefined,
    },
    {
      titulo: "Registrar a los estudiantes del piloto",
      detalle: publicados.length > 0 ? "Ya disponible." : "Disponible al publicar tu primer curso.",
      hecho: estudiantes > 0,
      bloqueado: publicados.length === 0,
      accion: { href: "/estudiantes", label: "Registrar" },
    },
  ];
  const hechos = pasos.filter((p) => p.hecho).length;

  let titulo: string;
  let descripcion: string;
  if (publicados.length > 0) {
    titulo = "Hoy en tu academia";
    descripcion = `${publicados.length} ${publicados.length === 1 ? "curso publicado" : "cursos publicados"} · ${estudiantes} ${
      estudiantes === 1 ? "estudiante registrado" : "estudiantes registrados"
    }`;
  } else if (cursos.length > 0) {
    titulo = "Tu curso está en camino";
    descripcion = "Termina tu borrador y publícalo para abrir el piloto.";
  } else {
    titulo = "Preparemos tu primer curso";
    descripcion = "Tu academia está creada. Estos son los pasos para abrir tu piloto.";
  }

  let siguiente: { titulo: string; texto: string; acciones: ReactNode };
  if (!tenant.onboardingCompletado) {
    siguiente = {
      titulo: "Termina de configurar tu academia",
      texto: "Pon nombre, color y logo para que tus estudiantes reconozcan tu marca.",
      acciones: <LinkButton href="/onboarding">Configurar academia</LinkButton>,
    };
  } else if (cursos.length === 0) {
    siguiente = {
      titulo: "Crea tu primer curso",
      texto: "Ármalo a tu ritmo, con una estructura sugerida o desde cero. El borrador se guarda solo.",
      acciones: <LinkButton href="/cursos/nuevo">Crear curso</LinkButton>,
    };
  } else if (publicados.length === 0 && borrador) {
    siguiente = {
      titulo: "Publica tu primer curso",
      texto: `Continúa con «${borrador.titulo}». Cuando esté listo, revísalo y publícalo.`,
      acciones: <LinkButton href={`/cursos/${borrador.id}/editar`}>Continuar borrador</LinkButton>,
    };
  } else if (estudiantes === 0) {
    siguiente = {
      titulo: "Registra a los estudiantes del piloto",
      texto: "Agrega a las personas que invitaste para llevar su seguimiento. Compárteles el enlace del curso tú.",
      acciones: (
        <>
          <LinkButton href="/estudiantes">Registrar estudiantes</LinkButton>
          {urlPublicado && <CopiarEnlace url={urlPublicado} />}
        </>
      ),
    };
  } else {
    siguiente = {
      titulo: "Tu piloto está abierto",
      texto: "Comparte el enlace del curso con tus estudiantes y suma más correos cuando quieras.",
      acciones: (
        <>
          {urlPublicado && <CopiarEnlace url={urlPublicado} variante="primary" />}
          <LinkButton href="/estudiantes" variante="secondary">
            Ver estudiantes
          </LinkButton>
        </>
      ),
    };
  }

  const cursosUrl: CursoConUrl[] = cursos.slice(0, 3).map((c) => ({ ...c, url: urlPublicaCurso(tenant, c.slug) }));

  return (
    <div className="ci-stack">
      <PageHeader titulo={titulo} descripcion={descripcion} />

      <section className="ci-card cr-protagonista" aria-labelledby="ci-sig-t">
        <h2 className="ci-card__title" id="ci-sig-t">
          {siguiente.titulo}
        </h2>
        <p className="ci-card__text">{siguiente.texto}</p>
        <div className="ci-actions">{siguiente.acciones}</div>
      </section>

      {hechos < pasos.length && <Checklist pasos={pasos} />}

      {publicados.length > 0 && (
        <Kpis estudiantes={alumnosActivos} dominioMedio={dominio} avancePromedio={avancePromedio} necesitanAyuda={enRiesgo.length} />
      )}

      <div className="ci-inicio">
        <div className="ci-inicio__main">
          {publicados.length > 0 && (
            <div className="ci-inicio__ayuda">
              <NecesitanAyuda alumnos={enRiesgo} />
            </div>
          )}
          {temas.length > 0 && (
            <div className="ci-inicio__temas">
              <TemasDificiles temas={temas} />
            </div>
          )}
          {cursosUrl.length > 0 && (
            <section className="ci-stack ci-inicio__cursos" style={{ gap: "var(--av-space-3)" }} aria-labelledby="ci-cursos-t">
              <div className="ci-check__head">
                <h2 className="ci-card__title" id="ci-cursos-t">
                  Tus cursos
                </h2>
                <LinkButton href="/cursos" variante="ghost">
                  Ver todos
                </LinkButton>
              </div>
              <ListaCursos cursos={cursosUrl} compacto />
            </section>
          )}
          {!tenant.logoUrl && (
            <section className="ci-card ci-inicio__logo" aria-labelledby="ci-logo-t">
              <h2 className="ci-card__title" id="ci-logo-t">
                Sube el logo de tu academia
              </h2>
              <p className="ci-card__text">
                Por ahora mostramos tus iniciales. Con tu logo, tus estudiantes reconocen tu marca en cada pantalla.
              </p>
              <div className="ci-actions">
                <LinkButton href="/mi-academia" variante="secondary">
                  Subir logo
                </LinkButton>
              </div>
            </section>
          )}
        </div>
        {publicados.length > 0 && (
          <div className="ci-inicio__act">
            <ActividadReciente items={actividad} ahora={ahora} />
          </div>
        )}
      </div>
    </div>
  );
}
