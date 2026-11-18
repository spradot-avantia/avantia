// Tiempo activo del alumno en una lección (ADR 040). Lo envía el navegador con sendBeacon al salir
// de la lección. Dato propio de la academia (alimenta el panel del creador): no depende de PostHog
// ni de cookies de terceros. El tenant sale del host y el alumno de la sesión, NUNCA del body.
import { NextResponse } from "next/server";
import { getTenantPublico } from "../../../../lib/alumno/contexto";
import { inscripcionDe } from "../../../../lib/alumno/inscripciones";
import { getAlumnoActual } from "../../../../lib/alumno/sesion";
import { supabaseAdmin } from "../../../../lib/supabase/admin";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const vacia = (status: number) => new NextResponse(null, { status });

export async function POST(req: Request) {
  let b: { cursoId?: unknown; leccionId?: unknown; visitaId?: unknown; activoSeg?: unknown };
  try {
    b = JSON.parse(await req.text());
  } catch {
    return vacia(400);
  }
  const { cursoId, leccionId, visitaId } = b;
  const activo = Math.round(Number(b.activoSeg));
  if (![cursoId, leccionId, visitaId].every((v) => typeof v === "string" && UUID.test(v)) || !Number.isFinite(activo)) return vacia(400);

  const [tenant, alumno] = await Promise.all([getTenantPublico(), getAlumnoActual()]);
  if (!tenant || !alumno) return vacia(401);
  const insc = await inscripcionDe(tenant.id, alumno.id, cursoId as string);
  if (!insc || insc.estado !== "activa") return vacia(403);

  const { data: lec } = await supabaseAdmin
    .from("lecciones")
    .select("id")
    .eq("tenant_id", tenant.id)
    .eq("curso_id", cursoId as string)
    .eq("id", leccionId as string)
    .maybeSingle();
  if (!lec) return vacia(404);

  const seg = Math.min(3600, Math.max(0, activo));
  const { data: previa } = await supabaseAdmin
    .from("sesiones_leccion")
    .select("id, activo_seg")
    .eq("tenant_id", tenant.id)
    .eq("alumno_id", alumno.id)
    .eq("visita_id", visitaId as string)
    .maybeSingle();
  if (previa) {
    await supabaseAdmin
      .from("sesiones_leccion")
      .update({ activo_seg: Math.max(previa.activo_seg as number, seg) })
      .eq("tenant_id", tenant.id)
      .eq("id", previa.id);
  } else {
    await supabaseAdmin.from("sesiones_leccion").insert({
      tenant_id: tenant.id,
      curso_id: cursoId,
      leccion_id: leccionId,
      alumno_id: alumno.id,
      visita_id: visitaId,
      activo_seg: seg,
    });
  }
  return vacia(204);
}
