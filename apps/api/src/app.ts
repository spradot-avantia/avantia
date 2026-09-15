import express, { type Express } from "express";
import cors from "cors";

import { resolveTenant } from "./middleware/resolveTenant.js";
import { tenantsRouter } from "./routes/tenants.js";
import { generarCursoRouter } from "./routes/ai/generarCurso.js";
import { stripeWebhookRouter } from "./routes/webhooks/stripe.js";
import { mercadopagoWebhookRouter } from "./routes/webhooks/mercadopago.js";

export function createApp(): Express {
  const app = express();

  app.use(
    cors({
      origin: process.env.WEB_APP_ORIGIN ?? "http://localhost:5173",
      credentials: true,
    })
  );

  // Los webhooks de Stripe necesitan el body crudo para verificar la firma,
  // por eso se montan ANTES del parser de JSON global.
  app.use("/api/webhooks/stripe", stripeWebhookRouter);

  app.use(express.json());

  app.use("/api/webhooks/mercadopago", mercadopagoWebhookRouter);

  // Resuelve el tenant a partir del hostname de la request (equivalente al
  // middleware.ts de Next.js) para todo lo que no sea un webhook de pagos.
  app.use(resolveTenant);

  app.use("/api/tenants", tenantsRouter);
  app.use("/api/ai/generar-curso", generarCursoRouter);

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  return app;
}
