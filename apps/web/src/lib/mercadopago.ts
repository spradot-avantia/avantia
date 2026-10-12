import { MercadoPagoConfig } from "mercadopago";

// Se instancia bajo demanda: la variable no es obligatoria para buildear ni
// para correr el resto de la app, solo para quien efectivamente cobra.
export function getMercadopagoClient() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("Falta MERCADOPAGO_ACCESS_TOKEN en las variables de entorno");
  }
  return new MercadoPagoConfig({ accessToken });
}
