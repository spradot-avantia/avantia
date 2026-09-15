import { useParams } from "react-router-dom";

export function EditarCursoPage() {
  const { cursoId } = useParams();

  return (
    <section>
      <h1>Editar curso {cursoId}</h1>
    </section>
  );
}
