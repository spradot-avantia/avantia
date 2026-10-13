import { NextResponse } from "next/server";

/**
 * DESHABILITADO (RQ-02). Antes: POST /api/tenants creaba tenants con service
 * role, sin sesion, sin membresia y sin transaccion; cualquiera podia crear
 * academias arbitrarias. El alta ahora vive en la RPC `crear_academia`
 * (db/migrations/0002_crear_academia.sql), invocada por la Server Action
 * `crearAcademiaAction` (lib/creador/actionsAlta.ts) con la sesion del usuario.
 * Se responde 410 en vez de borrar la ruta para que cualquier cliente viejo
 * reciba un mensaje claro. Ya no importa lib/supabase/admin.
 */
const GONE = {
  error: "Este endpoint fue retirado. Crea tu academia desde el onboarding (/onboarding) con tu sesión iniciada.",
};

export function POST() {
  return NextResponse.json(GONE, { status: 410 });
}

export function GET() {
  return NextResponse.json(GONE, { status: 410 });
}
