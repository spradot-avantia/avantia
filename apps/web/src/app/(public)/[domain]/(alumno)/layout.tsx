import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AnaliticaProvider } from "../../../../components/alumno/AnaliticaProvider";
import { AvisoAnaliticaAcademia, PreferenciasAnalitica } from "../../../../components/alumno/AvisoAnaliticaAcademia";
import { Cabecera } from "../../../../components/alumno/Cabecera";
import "../../../../components/alumno/alumno.css";
import { idSeudonimo } from "../../../../lib/analitica/identidad";
import { getAlumnoActual } from "../../../../lib/alumno/sesion";
import { colorTexto, textoSobre } from "../../../../lib/creador/color";
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
    <div className={`al ${clasesFuentes} ${clasesIdentidad(tenant.theme.tipografia, tenant.theme.forma)}`} style={{ ["--al-brand" as string]: color, ["--al-on-brand" as string]: textoSobre(color), ["--al-brand-text" as string]: colorTexto(color) }}>
      {/* Primero: sus efectos deben correr antes que los de RastreoLeccion/QuizPlayer (ADR 040). */}
      <AnaliticaProvider tenantId={tenant.id} distinctId={alumno ? idSeudonimo(tenant.id, alumno.id) : null} />
      <a className="al-skip" href="#contenido">
        Saltar al contenido
      </a>
      <Cabecera tenant={tenant} alumno={alumno} />
      <main id="contenido" tabIndex={-1} className="al-main">
        {children}
      </main>
      <footer className="al-foot">
        {tenant.nombre} · <a href="/terminos">Términos</a> · <a href="/privacidad">Privacidad</a> · <PreferenciasAnalitica />
      </footer>
      <AvisoAnaliticaAcademia academia={tenant.nombre} />
    </div>
  );
}
