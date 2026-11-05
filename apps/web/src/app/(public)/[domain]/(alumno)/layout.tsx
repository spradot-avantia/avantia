import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Cabecera } from "../../../../components/alumno/Cabecera";
import "../../../../components/alumno/alumno.css";
import { getAlumnoActual } from "../../../../lib/alumno/sesion";
import { textoSobre } from "../../../../lib/creador/color";
import { clasesFuentes } from "../../../../lib/tenant/fuentes";
import { clasesIdentidad } from "../../../../lib/tenant/identidad";
import { resolveTenantByHostname } from "../../../../lib/tenant/resolve";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: { domain: string } }): Promise<Metadata> {
  const tenant = await resolveTenantByHostname(params.domain);
  return tenant ? { title: { default: tenant.nombre, template: `%s · ${tenant.nombre}` } } : {};
}

// Marco de las pantallas del alumno (cuenta, cursos, lecciones, progreso, legales).
// El inicio de la academia (/) NO pasa por aquí: lo dibuja el template elegido por
// el creador (ADR 021). Marca: solo la de la academia, nunca Avantia.
export default async function AlumnoLayout({ children, params }: { children: ReactNode; params: { domain: string } }) {
  const tenant = await resolveTenantByHostname(params.domain);
  if (!tenant) notFound();
  const alumno = await getAlumnoActual();
  const color = tenant.theme.colorPrimario;
  return (
    <div className={`al ${clasesFuentes} ${clasesIdentidad(tenant.theme.tipografia, tenant.theme.forma)}`} style={{ ["--al-brand" as string]: color, ["--al-on-brand" as string]: textoSobre(color) }}>
      <a className="al-skip" href="#contenido">
        Saltar al contenido
      </a>
      <Cabecera tenant={tenant} alumno={alumno} />
      <main id="contenido" className="al-main">
        {children}
      </main>
      <footer className="al-foot">
        {tenant.nombre} · <a href="/terminos">Términos</a> · <a href="/privacidad">Privacidad</a>
      </footer>
    </div>
  );
}
