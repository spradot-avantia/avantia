const PAGINA = 1000;

/** Lee todas las filas de una consulta paginando (PostgREST corta en 1000 por defecto). Tope: 20 000. */
export async function todasLasFilas<T>(q: (desde: number, hasta: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < 20; i++) {
    const { data, error } = await q(i * PAGINA, (i + 1) * PAGINA - 1);
    if (error || !data) break;
    out.push(...data);
    if (data.length < PAGINA) break;
  }
  return out;
}
