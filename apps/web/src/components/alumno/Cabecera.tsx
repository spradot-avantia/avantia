import Link from "next/link";
import { FormAccion } from "./FormAccion";
import { salirAction } from "../../lib/alumno/actions";
import type { AlumnoSesion } from "../../lib/alumno/sesion";
import type { Tenant } from "../../types/tenant";
import { TabsAlumno } from "./TabsAlumno";
import { TenantMark } from "../creador/TenantMark";
import "./alumno.css";

export function Cabecera({ tenant, alumno }: { tenant: Tenant; alumno: AlumnoSesion | null }) {
  return (
    <header className="al-head">
      <div className="al-head__in">
        <Link href="/" className="al-brand" aria-label={`${tenant.nombre}: inicio`}>
          <TenantMark nombre={tenant.nombre} logoUrl={tenant.theme.logoUrl} logoModo={tenant.theme.logoModo} color={tenant.theme.colorPrimario} />
        </Link>
        {alumno ? (
          <>
            {/* En móvil las secciones van en una barra inferior (más cerca del pulgar) y el encabezado queda en una línea. */}
            <TabsAlumno />
            <div className="al-nav al-nav--cuenta">
              <span className="al-user" title={alumno.correo}>
                {alumno.nombre.split(" ")[0]}
              </span>
              <FormAccion action={salirAction}>
                <button type="submit">Salir</button>
              </FormAccion>
            </div>
          </>
        ) : (
          <nav className="al-nav" aria-label="Principal">
            <Link href="/ingresar">Ingresar</Link>
            <Link href="/registro" className="al-nav__cta">
              Crear cuenta
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
