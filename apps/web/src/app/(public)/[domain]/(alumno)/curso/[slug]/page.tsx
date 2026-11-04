import Link from "next/link";
import { notFound } from "next/navigation";
import { FormAccion } from "../../../../../../components/alumno/FormAccion";
import { FichaCurso } from "../../../../../../components/tenant/FichaCurso";
import { inscribirseAction } from "../../../../../../lib/alumno/actions";
import { cargarCurso } from "../../../../../../lib/alumno/catalogo";
import { getTenantPublico } from "../../../../../../lib/alumno/contexto";
import { inscripcionDe } from "../../../../../../lib/alumno/inscripciones";
import { getAlumnoActual } from "../../../../../../lib/alumno/sesion";
import { limpiarCampana } from "../../../../../../lib/alumno/validacion";

export const dynamic = "force-dynamic";

type Busqueda = { error?: string; origen?: string; utm_source?: string; utm_campaign?: string; utm_medium?: string };

export default async function CursoPage({ params, searchParams }: { params: { domain: string; slug: string }; searchParams: Busqueda }) {
  const tenant = await getTenantPublico();
  if (!tenant) notFound();

  // Filtro por tenant Y slug: dos academias pueden repetir slug. Solo cursos publicados.
  const curso = await cargarCurso(tenant.id, { slug: params.slug });
  if (!curso) notFound();

  const alumno = await getAlumnoActual();
  const insc = alumno ? await inscripcionDe(tenant.id, alumno.id, curso.id) : null;

  // La campaña del enlace del anuncio viaja con el alumno hasta la inscripción.
  const campana = limpiarCampana([searchParams.utm_source, searchParams.utm_campaign].filter(Boolean).join(" / ") || null);
  const origen = searchParams.origen === "anuncio" || campana ? "anuncio" : "pagina";
  const q = new URLSearchParams({ curso: curso.slug, origen });
  if (campana) q.set("campana", campana);

  let cta: React.ReactNode;
  if (insc?.estado === "activa") {
    cta = (
      <Link className="fc-cta" href={`/aprender/${curso.id}`}>
        Continuar el curso
      </Link>
    );
  } else if (insc?.estado === "pendiente") {
    cta = (
      <Link className="fc-cta" href="/mis-cursos">
        Ver mi inscripción (pendiente)
      </Link>
    );
  } else if (alumno && !insc) {
    cta = (
      <FormAccion action={inscribirseAction}>
        <input type="hidden" name="curso" value={curso.slug} />
        {campana && <input type="hidden" name="campana" value={campana} />}
        {curso.acceso === "invitados" && <input type="hidden" name="solicitud" value="1" />}
        <button type="submit" className="fc-cta">
          {curso.acceso === "invitados" ? "Solicitar acceso" : "Inscribirme"}
        </button>
      </FormAccion>
    );
  } else if (!alumno) {
    cta = (
      <Link className="fc-cta" href={`/registro?${q.toString()}`}>
        {curso.acceso === "invitados" ? "Entrar al curso" : "Inscribirme"}
      </Link>
    );
  } else {
    cta = (
      <Link className="fc-cta" href="/mis-cursos">
        Ir a mis cursos
      </Link>
    );
  }

  return (
    <>
      {searchParams.error && (
        <p className="al-alert al-alert--error" role="alert">
          {searchParams.error.slice(0, 300)}
        </p>
      )}
      <FichaCurso
        sinCabecera
        cta={cta}
        tenant={{
          nombre: tenant.nombre,
          logoUrl: tenant.theme.logoUrl,
          logoModo: tenant.theme.logoModo,
          colorPrimario: tenant.theme.colorPrimario,
        }}
        curso={curso}
      />
      {!alumno && (
        <p className="al-muted">
          ¿Ya tienes cuenta? <Link href={`/ingresar?next=${encodeURIComponent(`/curso/${curso.slug}`)}`}>Ingresa aquí</Link>.
        </p>
      )}
    </>
  );
}
