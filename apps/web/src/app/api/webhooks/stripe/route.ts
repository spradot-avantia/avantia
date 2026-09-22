import { NextResponse } from "next/server";
import { stripe } from "../../../../lib/stripe";

// Stripe firma el body crudo, no el JSON ya parseado: por eso se lee con
// request.text() en vez de request.json() (Next.js no parsea el body de
// entrada en route handlers, así que no hace falta nada especial como el
// express.raw() de la versión Express).
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Falta firma o webhook secret" },
      { status: 400 }
    );
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }

  // TODO: manejar event.type (checkout.session.completed, etc.) y
  // acreditar la inscripción del alumno + el split payment al tenant.

  return NextResponse.json({ received: true });
}
