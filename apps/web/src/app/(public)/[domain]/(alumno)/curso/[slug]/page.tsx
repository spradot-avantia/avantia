import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FormAccion } from "../../../../../../components/alumno/FormAccion";
import { FichaCurso } from "../../../../../../components/tenant/FichaCurso";
import { inscribirseAction, pagarCursoAction } from "../../../../../../lib/alumno/actions";
import { cargarCurso } from "../../../../../../lib/alumno/catalogo";
import { getTenantPublico } from "../../../../../../lib/alumno/contexto";
import { inscripcionDe } from "../../../../../../lib/alumno/inscripciones";
import { getAlumnoActual } from "../../../../../../lib/alumno/sesion";
import { limpiarCampana } from "../../../../../../lib/alumno/validacion";
import { pagosHabilitados } from "../../../../../../lib/pagos/iniciar";
import { formatearPrecio } from "../../../../../../lib/sitio/tipos";

export const dynamic = "force-dynamic";

/** Título y descripción propios de la ficha (SEO y pestaña del navegador): el curso, no solo la academia. */
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const tenant = await getTenantPublico();
  if (!tenant) return {};
  const curso = await cargarCurso(tenant.id, { slug: params.slug });
  if (!curso) return {};
  const d = (curso.descripcion ?? "").replace(/\s+/g, " ").trim();
  return {
    title: `${curso.titulo} · ${tenant.nombre}`,
    description: d ? (d.length > 160 ? `${d.slice(0, 157).trimEnd()}…` : d) : `Curso online de ${tenant.nombre}.`,
  };
}

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

  // Curso con precio y abierto por enlace: se paga con Mercado Pago (ADR 046).
  const precio = curso.precioCentavos > 0 ? formatearPrecio(curso.precioCentavos, "CLP") : null;
  const pagable = !!precio && curso.acceso === "enlace" && pagosHabilitados();
  const formPago = (texto: string) => (
    <FormAccion action={pagarCursoAction}>
      <input type="hidden" name="curso" value={curso.slug} />
      {campana && <input type="hidden" name="campana" value={campana} />}
      <button type="submit" className="fc-cta">
        {texto}
      </button>
      <p className="al-muted">Pagas con Mercado Pago. Al confirmarse el pago, el curso se abre de inmediato.</p>
    </FormAccion>
  );

  let cta: React.ReactNode;
  if (insc?.estado === "activa") {
    cta = (
      <Link className="fc-cta" href={`/aprender/${curso.id}`}>
        Continuar el curso
      </Link>
    );
  } else if (insc?.estado === "pendiente" && pagable) {
    cta = formPago(`Pagar ${precio}`);
  } else if (insc?.estado === "pendiente") {
    cta = (
      <Link className="fc-cta" href="/mis-cursos">
        Ver mi inscripción (pendiente)
      </Link>
    );
  } else if (alumno && !insc && pagable) {
    cta = formPago(`Inscribirme por ${precio}`);
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
        {curso.acceso === "invitados" ? "Entrar al curso" : pagable ? `Inscribirme por ${precio}` : "Inscribirme"}
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
