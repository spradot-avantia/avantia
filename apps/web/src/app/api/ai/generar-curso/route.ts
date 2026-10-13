import { NextResponse } from "next/server";
import { generarCursoDesdeMaterial } from "../../../../lib/ai/generarCurso";
import { getCreadorContext } from "../../../../lib/creador/tenantActual";

export async function POST(request: Request) {
  // El tenant se deriva de la sesión (membresía), nunca del body. Sin sesión
  // no hay llamada al LLM: el modo demo (sin sesión) tampoco aplica aquí.
  const ctx = await getCreadorContext();
  if (!ctx || ctx.modo !== "sesion") {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let materialCrudo: string | undefined;
  try {
    ({ materialCrudo } = (await request.json()) as { materialCrudo?: string });
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  if (!materialCrudo) {
    return NextResponse.json(
      { error: "Falta materialCrudo en el body" },
      { status: 400 }
    );
  }

  try {
    const curso = await generarCursoDesdeMaterial({
      tenantId: ctx.tenant.id,
      materialCrudo,
    });
    return NextResponse.json(curso);
  } catch {
    return NextResponse.json(
      { error: "No se pudo generar el curso" },
      { status: 500 }
    );
  }
}
