import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  throw new Error("Falta STRIPE_SECRET_KEY en las variables de entorno");
}

export const stripe = new Stripe(secretKey, {
  apiVersion: "2024-06-20",
});
