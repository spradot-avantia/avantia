import { useParams } from "react-router-dom";

export function AprenderPage() {
  const { cursoId, leccionId } = useParams();

  return (
    <section>
      <h1>Reproductor del curso {cursoId}</h1>
      <p>Lección {leccionId}</p>
      {/* Acá va el player embebido (Bunny Stream / Mux). */}
    </section>
  );
}
