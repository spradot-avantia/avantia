import { MercadoPagoConfig } from "mercadopago";

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

if (!accessToken) {
  throw new Error("Falta MERCADOPAGO_ACCESS_TOKEN en las variables de entorno");
}

export const mercadopagoClient = new MercadoPagoConfig({ accessToken });
