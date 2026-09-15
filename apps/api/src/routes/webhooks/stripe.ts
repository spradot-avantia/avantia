import { Router } from "express";
import express from "express";
import { stripe } from "../../lib/stripe.js";

export const stripeWebhookRouter = Router();

// express.raw() es necesario acá porque Stripe firma el body crudo, no el
// JSON ya parseado. Por eso este router se monta antes de express.json()
// en app.ts.
stripeWebhookRouter.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      return res.status(400).json({ error: "Falta firma o webhook secret" });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        webhookSecret
      );
    } catch (err) {
      return res.status(400).json({ error: "Firma inválida" });
    }

    // TODO: manejar event.type (checkout.session.completed, etc.) y
    // acreditar la inscripción del alumno + el split payment al tenant.

    res.json({ received: true });
  }
);
