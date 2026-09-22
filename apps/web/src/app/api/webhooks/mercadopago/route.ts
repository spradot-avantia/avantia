import { NextResponse } from "next/server";

export async function POST() {
  // TODO: validar la notificación contra la API de Mercado Pago (no viene
  // firmada como Stripe, hay que confirmar el pago consultando el recurso)
  // y acreditar la inscripción del alumno + el split payment al tenant.
  return NextResponse.json({ received: true });
}
