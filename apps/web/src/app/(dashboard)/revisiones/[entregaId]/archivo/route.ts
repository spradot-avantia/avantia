// Descarga de la entrega de un alumno para el creador (ADR 038). Exige la sesión del creador y
// que la entrega sea de SU academia (RLS + tenant.id); responde con una URL firmada de 60 s.
import { NextResponse } from "next/server";
import { urlDeEntrega } from "../../../../../lib/creador/tareas";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SIN_CACHE = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" };

export async function GET(_req: Request, { params }: { params: { entregaId: string } }) {
  if (!UUID.test(params.entregaId)) return new NextResponse("Entrega no encontrada.", { status: 404, headers: SIN_CACHE });
  let url: string | null = null;
  try {
    url = await urlDeEntrega(params.entregaId);
  } catch {
    return new NextResponse("Inicia sesión para abrir la entrega.", { status: 401, headers: SIN_CACHE });
  }
  if (!url) return new NextResponse("Entrega no encontrada.", { status: 404, headers: SIN_CACHE });
  return NextResponse.redirect(url, { status: 302, headers: SIN_CACHE });
}
