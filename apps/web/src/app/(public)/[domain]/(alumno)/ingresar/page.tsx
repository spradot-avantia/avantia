import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FormIngreso } from "../../../../../components/alumno/Formularios";
import { getAlumnoActual } from "../../../../../lib/alumno/sesion";
import { sanitizarNextAlumno } from "../../../../../lib/alumno/validacion";

export const metadata: Metadata = { title: "Ingresar" };
export const dynamic = "force-dynamic";

export default async function IngresarPage({ searchParams }: { searchParams: { next?: string; email?: string } }) {
  const next = sanitizarNextAlumno(searchParams.next);
  if (await getAlumnoActual()) redirect(next);
  const email = typeof searchParams.email === "string" && searchParams.email.length <= 254 ? searchParams.email : undefined;
  return (
    <div className="al-main--estrecho al-stack" style={{ width: "100%", margin: "0 auto" }}>
      <h1>Ingresar</h1>
      <FormIngreso next={next} emailInicial={email} />
    </div>
  );
}
