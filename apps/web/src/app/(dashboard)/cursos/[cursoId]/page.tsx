export default function EditarCursoPage({
  params,
}: {
  params: { cursoId: string };
}) {
  return (
    <section>
      <h1>Editar curso {params.cursoId}</h1>
    </section>
  );
}
