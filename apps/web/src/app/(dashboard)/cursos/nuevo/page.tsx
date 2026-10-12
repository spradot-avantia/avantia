import { PageHeader, SinAcademia } from "../../../../components/creador";
import { ComoEmpezar } from "../../../../components/creador/cursos/ComoEmpezar";
import "../../../../components/creador/inicio/inicio.css";
import { getCurrentTenant } from "../../../../lib/creador/tenantActual";
import { PASOS_EDITOR } from "../../../../lib/creador/types";

export const dynamic = "force-dynamic";

const DETALLE: Record<string, string> = {
  esencial: "Título y descripción",
  objetivo: "Qué podrán hacer al terminar",
  estructura: "Módulos, lecciones y actividades",
  modalidad: "A su ritmo o con fechas",
  acceso: "Quién puede inscribirse",
  revisar: "Vista previa y publicación",
};

export default async function NuevoCursoPage() {
  let hayTenant = true;
  try {
    hayTenant = !!(await getCurrentTenant());
  } catch (e) {
    console.error("[cursos/nuevo]", e);
  }
  if (!hayTenant) return <SinAcademia />;

  return (
    <div className="ci-stack">
      <PageHeader
        titulo="Crea tu curso"
        descripcion="Tú lo armas, a tu ritmo. El borrador se guarda solo y lo publicas cuando esté listo."
        volver={{ href: "/cursos", label: "Cursos" }}
      />
      <ComoEmpezar />
      <section className="ci-card" aria-labelledby="ci-def-t">
        <h2 className="ci-card__title" id="ci-def-t">
          Lo que vas a definir
        </h2>
        <ol className="ci-steplist">
          {PASOS_EDITOR.map((p) => (
            <li key={p.id}>
              <span>
                <strong>{p.titulo}</strong>
                <span className="ci-muted">{DETALLE[p.id]}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>
      <aside className="ci-card ci-card--accent">
        <h2 className="ci-card__title">Te conviene tener a mano</h2>
        <p className="ci-card__text">
          Los enlaces de tus videos (YouTube, Vimeo o Google Drive) y de tus documentos. Subir archivos aún no está disponible.
        </p>
      </aside>
    </div>
  );
}
