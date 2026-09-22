import { NextResponse } from "next/server";
import { generarCursoDesdeMaterial } from "../../../../lib/ai/generarCurso";

export async function POST(request: Request) {
  // TODO: derivar el tenant de la sesión del usuario logueado (panel
  // interno, sin hostname propio) en vez de recibirlo en el body. Mismo gap
  // que existía en la versión Express: resolveTenant no fijaba tenant para
  // requests al panel, quedaba pendiente resolverlo por sesión.
  const { tenantId, materialCrudo } = (await request.json()) as {
    tenantId?: string;
    materialCrudo?: string;
  };

  if (!tenantId) {
    return NextResponse.json(
      { error: "No se pudo determinar el tenant" },
      { status: 400 }
    );
  }

  if (!materialCrudo) {
    return NextResponse.json(
      { error: "Falta materialCrudo en el body" },
      { status: 400 }
    );
  }

  try {
    const curso = await generarCursoDesdeMaterial({ tenantId, materialCrudo });
    return NextResponse.json(curso);
  } catch {
    return NextResponse.json(
      { error: "No se pudo generar el curso" },
      { status: 500 }
    );
  }
}
