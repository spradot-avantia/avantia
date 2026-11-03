import Link from "next/link";
import { EmptyState, SinAcademia } from "../../../../components/creador";
import { Encuesta } from "../../../../components/creador/pagina/Encuesta";
import { cargarPaginaCreador, cursosPublicados } from "../../../../lib/creador/paginaData";

export const dynamic = "force-dynamic";
export const metadata = { title: "Diseña tu academia" };

// Encuesta de 5 preguntas que recomienda un template (diseño 2.1, ADR 018).
export default async function EncuestaPage() {
  const carga = await cargarPaginaCreador();
  if (carga.estado === "sin_academia") return <SinAcademia />;
  if (carga.estado === "error") {
    return <EmptyState titulo="No pudimos abrir la encuesta" descripcion="Inténtalo de nuevo en unos minutos." />;
  }
  const { academia, cursos, direccion } = carga.datos;
  return (
    <div>
      <Link className="cr-back" href="/mi-academia#pagina">
        ← Volver a Mi academia
      </Link>
      <Encuesta academia={academia} cursos={cursosPublicados(cursos)} direccion={direccion} />
    </div>
  );
}