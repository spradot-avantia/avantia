import Link from "next/link";
import { FormAccion } from "./FormAccion";
import { salirAction } from "../../lib/alumno/actions";
import type { AlumnoSesion } from "../../lib/alumno/sesion";
import type { Tenant } from "../../types/tenant";
import { TenantMark } from "../creador/TenantMark";
import "./alumno.css";

export function Cabecera({ tenant, alumno }: { tenant: Tenant; alumno: AlumnoSesion | null }) {
  return (
    <header className="al-head">
      <div className="al-head__in">
        <Link href="/" className="al-brand" aria-label={`${tenant.nombre}: inicio`}>
          <TenantMark nombre={tenant.nombre} logoUrl={tenant.theme.logoUrl} logoModo={tenant.theme.logoModo} color={tenant.theme.colorPrimario} />
        </Link>
        <nav className="al-nav" aria-label="Principal">
          {alumno ? (
            <>
              <Link href="/mis-cursos">Mis cursos</Link>
              <Link href="/progreso">Mi progreso</Link>
              <span className="al-user" title={alumno.correo}>
                {alumno.nombre.split(" ")[0]}
              </span>
              <FormAccion action={salirAction}>
                <button type="submit">Salir</button>
              </FormAccion>
            </>
          ) : (
            <>
              <Link href="/ingresar">Ingresar</Link>
              <Link href="/registro" className="al-nav__cta">
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
