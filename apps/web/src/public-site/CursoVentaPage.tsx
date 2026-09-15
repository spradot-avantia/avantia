import { useParams } from "react-router-dom";

export function CursoVentaPage() {
  const { slug } = useParams();

  return (
    <section>
      <h1>Página de venta del curso {slug}</h1>
    </section>
  );
}
