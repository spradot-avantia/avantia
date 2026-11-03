// Contexto del sitio público de una academia: el tenant SIEMPRE sale del host de
// la request (nunca del body ni de parámetros). Ver ADR 018.
import { cache } from "react";
import { headers } from "next/headers";
import { resolveTenantByHostname } from "../tenant/resolve";
import type { Tenant } from "../../types/tenant";

function hostActual(): string {
  return (headers().get("host") ?? "").split(":")[0].trim().toLowerCase();
}

/** Tenant dueño del host actual, o null si el host no corresponde a ninguna academia. */
export const getTenantPublico = cache(async (): Promise<Tenant | null> => {
  const host = hostActual();
  if (!host) return null;
  return resolveTenantByHostname(host);
});

export class SinAcademiaError extends Error {
  constructor() {
    super("Este sitio no corresponde a ninguna academia.");
    this.name = "SinAcademiaError";
  }
}

export async function requireTenantPublico(): Promise<Tenant> {
  const t = await getTenantPublico();
  if (!t) throw new SinAcademiaError();
  return t;
}

/** https://<host> de la academia (http solo en localhost), para enlaces de correo. */
export function origenPublico(): string {
  const h = headers();
  const host = h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto")?.split(",")[0].trim() || (/^(localhost|127\.|\[::1\])|\.localhost(:|$)/.test(host) ? "http" : "https");
  return `${proto}://${host}`;
}

/** IP aproximada solo para limitar intentos; no se guarda. */
export function claveCliente(): string {
  const h = headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "desconocida";
}
