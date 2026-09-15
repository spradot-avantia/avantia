import { Router } from "express";

export const mercadopagoWebhookRouter = Router();

mercadopagoWebhookRouter.post("/", async (req, res) => {
  // TODO: validar la notificación contra la API de Mercado Pago (no viene
  // firmada como Stripe, hay que confirmar el pago consultando el recurso)
  // y acreditar la inscripción del alumno + el split payment al tenant.
  res.json({ received: true });
});
