import type { NextFunction, Request, Response } from "express";
import { resolveTenantByHostname } from "../lib/tenant/resolve.js";

const PANEL_HOST_SUFFIX = process.env.PANEL_HOST_SUFFIX ?? "app.avantia.app";

/**
 * Equivalente al middleware.ts de Next.js: se ejecuta antes de las rutas de
 * negocio y resuelve a qué tenant corresponde la request según el hostname.
 * Las requests al panel interno (app.avantia.app) no llevan tenant propio,
 * ahí el tenant se determina por la sesión del usuario logueado, no por el
 * dominio.
 */
export async function resolveTenant(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const hostname = req.hostname;

  if (hostname.endsWith(PANEL_HOST_SUFFIX) || hostname === "localhost") {
    return next();
  }

  const tenant = await resolveTenantByHostname(hostname);

  if (!tenant) {
    return res.status(404).json({ error: "Academia no encontrada" });
  }

  req.tenant = tenant;
  next();
}
