export default function AprenderPage({
  params,
}: {
  params: { cursoId: string; leccionId: string };
}) {
  return (
    <section>
      <h1>Reproductor del curso {params.cursoId}</h1>
      <p>Lección {params.leccionId}</p>
      {/* Acá va el player embebido (Bunny Stream / Mux). */}
    </section>
  );
}
