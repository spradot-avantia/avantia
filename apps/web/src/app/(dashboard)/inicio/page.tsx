import type { ReactNode } from "react";
import { EmptyState, LinkButton, PageHeader, SinAcademia } from "../../../components/creador";
import { Checklist, type PasoChecklist } from "../../../components/creador/inicio/Checklist";
import { ConfiguracionAcademia, type ItemConfig } from "../../../components/creador/inicio/ConfiguracionAcademia";
import { CopiarEnlace } from "../../../components/creador/inicio/CopiarEnlace";
import { CursosResumen, type CursoConCompletitud } from "../../../components/creador/inicio/CursosResumen";
import { ActividadReciente } from "../../../components/creador/inicio/ActividadReciente";
import { NecesitanAyuda, TemasDificiles } from "../../../components/creador/inicio/Atencion";
import { Kpis } from "../../../components/creador/inicio/Kpis";
import "../../../components/creador/inicio/inicio.css";
import { cargarActividadReciente, cargarTemasDificiles } from "../../../lib/creador/actividadReciente";
import {
  agruparPorAlumno,
  distribucionAvance,
  distribucionDominio,
  dominioMedio,
  estudiantesPorCurso,
  necesitanAyuda,
} from "../../../lib/creador/actividadReglas";
import { completitudCurso } from "../../../lib/creador/completitud";
import { getCurso, listarCursos } from "../../../lib/creador/cursos";
import { listarEstudiantes } from "../../../lib/creador/estudiantes";
import { listarInscripciones } from "../../../lib/creador/inscripciones";
import { getPagina } from "../../../lib/creador/pagina";
import { urlPublicaCurso } from "../../../lib/creador/publicacion";
import { getCurrentTenant } from "../../../lib/creador/tenantActual";
import type { CursoResumen, Invitacion, TenantCreador } from "../../../lib/creador/types";
import { pagosHabilitados } from "../../../lib/pagos/iniciar";

export const dynamic = "force-dynamic";

/** Cursos que se muestran en el Inicio con su completitud (cada uno carga su contenido). */
const MAX_CURSOS = 3;
/** Ítems del feed a leer antes de agrupar por estudiante. */
const MAX_ACTIVIDAD = 40;

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
      pagina: null as Awaited<ReturnType<typeof getPagina>> | null,
      contenidos: [] as Awaited<ReturnType<typeof getCurso>>[],
    };
  // Lo secundario (dominio, actividad, temas, página, contenido) no tumba el Inicio si falla: se muestra vacío.
  const [cursos, inv, inscripciones, actividad, temas, pagina] = await Promise.all([
    listarCursos(),
    listarEstudiantes(),
    listarInscripciones().catch(() => []),
    cargarActividadReciente(MAX_ACTIVIDAD).catch((e) => {
      console.error("[inicio] actividad", e);
      return [];
    }),
    cargarTemasDificiles().catch(() => []),
    getPagina().catch(() => null),
  ]);
  const contenidos = await Promise.all(cursos.slice(0, MAX_CURSOS).map((c) => getCurso(c.id).catch(() => null)));
  return { tenant, cursos, inv, inscripciones, actividad, temas, pagina, contenidos };
}

export default async function InicioPage() {
  let datos: Awaited<ReturnType<typeof cargar>>;
  try {
    datos = await cargar();
  } catch (e) {
    console.error("[inicio] no se pudo cargar", e);
    return <EmptyState titulo="No pudimos cargar tu inicio" descripcion="Revisa tu conexión e inténtalo de nuevo en unos minutos." />;
  }
  const { tenant, cursos, inv, inscripciones, actividad, temas, pagina, contenidos } = datos;
  if (!tenant) return <SinAcademia />;

  const activas = inscripciones.filter((i) => i.estado === "activa");
  const avancePromedio = activas.length ? Math.round(activas.reduce((t, i) => t + i.avance, 0) / activas.length) : null;
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
  const urlAcademia = new URL(urlPublicaCurso(tenant, "")).origin;

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
    descripcion = `Tienes activos ${publicados.length} ${publicados.length === 1 ? "curso" : "cursos"} y ${alumnosActivos} ${
      alumnosActivos === 1 ? "estudiante" : "estudiantes"
    }`;
  } else if (cursos.length > 0) {
    titulo = "Tu curso está en camino";
    descripcion = "Termina tu borrador y publícalo para abrir el piloto.";
  } else {
    titulo = "Preparemos tu primer curso";
    descripcion = "Tu academia está creada. Estos son los pasos para abrir tu piloto.";
  }

  // Siguiente paso: solo mientras falte algo. Con el piloto abierto, el Inicio es el resumen.
  let siguiente: { titulo: string; texto: string; acciones: ReactNode } | null = null;
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
  }

  const cursosInicio: CursoConCompletitud[] = cursos.slice(0, MAX_CURSOS).map((c, i) => {
    const contenido = contenidos[i];
    return { ...c, url: urlPublicaCurso(tenant, c.slug), completitud: contenido ? completitudCurso(contenido) : null };
  });

  const cobros = pagosHabilitados();
  const config: ItemConfig[] = [
    {
      nombre: "Nombre y color",
      estado: tenant.onboardingCompletado ? "Listo" : "Sin terminar",
      listo: tenant.onboardingCompletado,
      accion: { href: tenant.onboardingCompletado ? "/mi-academia#marca" : "/onboarding", label: tenant.onboardingCompletado ? "Editar" : "Configurar" },
    },
    {
      nombre: "Logo",
      estado: tenant.logoUrl ? "Subido" : "Mostramos tus iniciales",
      listo: !!tenant.logoUrl,
      accion: { href: "/mi-academia#marca", label: tenant.logoUrl ? "Cambiar" : "Subir logo" },
    },
    {
      nombre: "Página pública",
      estado: pagina === null ? "No pudimos revisarla" : pagina.publicado ? "Publicada" : "Sin publicar",
      listo: !!pagina?.publicado,
      accion: { href: "/mi-academia#pagina", label: pagina?.publicado ? "Editar" : "Publicar" },
    },
    {
      nombre: "Dominio propio",
      estado: tenant.customDomain ? `Conectado: ${tenant.customDomain}` : pagina?.dominioSolicitado ? "Solicitado, en revisión" : "Sin conectar",
      listo: !!tenant.customDomain,
      accion: { href: "/mi-academia#dominio", label: tenant.customDomain ? "Ver" : "Conectar" },
    },
    {
      nombre: "Cobros con Mercado Pago",
      estado: cobros ? "Activos" : "Próximamente",
      listo: cobros,
    },
  ];

  const hayPublicados = publicados.length > 0;

  return (
    <div className="ci-stack">
      <PageHeader
        titulo={titulo}
        descripcion={descripcion}
        acciones={
          hayPublicados ? (
            <>
              <LinkButton href={urlAcademia} variante="secondary" target="_blank" rel="noopener noreferrer">
                Ver academia
              </LinkButton>
              <LinkButton href="/cursos/nuevo">Crear curso</LinkButton>
            </>
          ) : undefined
        }
      />

      {siguiente && (
        <section className="ci-card cr-protagonista" aria-labelledby="ci-sig-t">
          <h2 className="ci-card__title" id="ci-sig-t">
            {siguiente.titulo}
          </h2>
          <p className="ci-card__text">{siguiente.texto}</p>
          <div className="ci-actions">{siguiente.acciones}</div>
        </section>
      )}

      {hechos < pasos.length && <Checklist pasos={pasos} />}

      <div className="ci-inicio-cq">
        {hayPublicados && (
          <Kpis
            dominioMedio={dominioMedio(inscripciones)}
            dominio={distribucionDominio(inscripciones)}
            avancePromedio={avancePromedio}
            avance={distribucionAvance(inscripciones)}
            estudiantes={alumnosActivos}
            porCurso={estudiantesPorCurso(inscripciones)}
            enRiesgo={enRiesgo}
          />
        )}

        <div className={`ci-inicio${hayPublicados ? "" : " ci-inicio--inicial"}`}>
          {cursosInicio.length > 0 && (
            <div className="ci-inicio__cursos">
              <CursosResumen cursos={cursosInicio} />
            </div>
          )}
          {hayPublicados && (
            <div className="ci-inicio__ayuda">
              <NecesitanAyuda alumnos={enRiesgo} />
            </div>
          )}
          {hayPublicados && (
            <div className="ci-inicio__temas">
              <TemasDificiles temas={temas} />
            </div>
          )}
          {hayPublicados && (
            <div className="ci-inicio__act">
              <ActividadReciente grupos={agruparPorAlumno(actividad)} ahora={ahora} />
            </div>
          )}
          <div className="ci-inicio__conf">
            <ConfiguracionAcademia items={config} />
          </div>
        </div>
      </div>
    </div>
  );
}
