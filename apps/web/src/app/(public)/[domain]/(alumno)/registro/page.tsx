import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FormRegistro } from "../../../../../components/alumno/Formularios";
import { cargarCurso } from "../../../../../lib/alumno/catalogo";
import { getTenantPublico } from "../../../../../lib/alumno/contexto";
import { getAlumnoActual } from "../../../../../lib/alumno/sesion";
import { limpiarCampana } from "../../../../../lib/alumno/validacion";

export const metadata: Metadata = { title: "Crear cuenta" };
export const dynamic = "force-dynamic";

type Busqueda = { curso?: string; origen?: string; campana?: string; email?: string };

export default async function RegistroPage({ searchParams }: { searchParams: Busqueda }) {
  const [tenant, alumno] = await Promise.all([getTenantPublico(), getAlumnoActual()]);
  if (alumno) redirect("/mis-cursos");

  const curso = tenant && searchParams.curso ? await cargarCurso(tenant.id, { slug: searchParams.curso.slice(0, 120) }) : null;
  const email = typeof searchParams.email === "string" && searchParams.email.length <= 254 ? searchParams.email : undefined;

  return (
    <div className="al-main--estrecho al-stack" style={{ width: "100%", margin: "0 auto" }}>
      <h1>Crea tu cuenta</h1>
      <p className="al-lede" style={{ fontSize: "var(--av-fs-base)" }}>
        {curso ? (
          <>
            Para entrar a <strong>{curso.titulo}</strong>, crea tu cuenta en {tenant?.nombre}. Te enviaremos un enlace para confirmar tu correo.
          </>
        ) : (
          <>Tu cuenta es de {tenant?.nombre}. Te enviaremos un enlace para confirmar tu correo.</>
        )}
      </p>
      <FormRegistro
        cursoSlug={curso?.slug}
        origen={searchParams.origen === "anuncio" ? "anuncio" : undefined}
        campana={limpiarCampana(searchParams.campana) ?? undefined}
        emailInicial={email}
      />
    </div>
  );
}
