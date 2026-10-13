import { headers } from "next/headers";
import { classifyHost } from "../tenant/host";

/** Misma configuración de hosts que middleware.ts. */
export function hostEsPanel(host: string): boolean {
  return (
    classifyHost(host, {
      panelHost: process.env.PANEL_HOST_SUFFIX ?? "app.avantia.app",
      marketingHosts: (process.env.MARKETING_HOSTS ?? "avantia.app,www.avantia.app")
        .split(",")
        .map((h) => h.trim())
        .filter(Boolean),
    }) === "panel"
  );
}

/** URL base del panel (para enlaces desde marketing y redirects de correo). */
export function urlPanel(): string {
  return (process.env.NEXT_PUBLIC_PANEL_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

export function hostActual(): string {
  return headers().get("host")?.split(":")[0] ?? "";
}

/** Ruta pedida (la fija middleware en host de panel, pisando cualquier valor del cliente). */
export function rutaActual(): string {
  return headers().get("x-av-pathname") ?? "/";
}
