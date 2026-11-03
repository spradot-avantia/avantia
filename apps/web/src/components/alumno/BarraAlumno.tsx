import Link from "next/link";
import { salirAction } from "../../lib/alumno/actions";
import type { AlumnoSesion } from "../../lib/alumno/sesion";
import { FormAccion } from "./FormAccion";
import "./alumno.css";

/** Acceso del alumno sobre el inicio de la academia (el template del creador no trae sesión). */
export function BarraAlumno({ alumno }: { alumno: AlumnoSesion | null }) {
  return (
    <nav className="al-barra" aria-label="Tu cuenta">
      {alumno ? (
        <>
          <span>Hola, {alumno.nombre.split(" ")[0]}</span>
          <Link href="/mis-cursos">Mis cursos</Link>
          <Link href="/progreso">Mi progreso</Link>
          <FormAccion action={salirAction}>
            <button type="submit">Salir</button>
          </FormAccion>
        </>
      ) : (
        <>
          <span>¿Ya eres estudiante?</span>
          <Link href="/ingresar">Ingresar</Link>
        </>
      )}
    </nav>
  );
}
