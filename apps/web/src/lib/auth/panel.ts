import { headers } from "next/headers";
import { classifyHost } from "../tenant/host";

/** Destino tras confirmar el correo de un signup (lo fija signUpAction). */
export const COOKIE_NEXT = "av-next";

function lista(valor: string | undefined, porDefecto: string): string[] {
  return (valor ?? porDefecto)
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean);
}

/** Configuración de hosts compartida con middleware.ts. */
export function configHosts() {
  return {
    panelHost: process.env.PANEL_HOST_SUFFIX ?? "app.avantia.app",
    marketingHosts: lista(process.env.MARKETING_HOSTS, "avantia.app,www.avantia.app"),
    platformHosts: lista(process.env.PLATFORM_HOSTS, ""),
  };
}

/** El host puede tener sesión del creador: panel o host único (plataforma). */
export function hostEsPanel(host: string): boolean {
  const kind = classifyHost(host, configHosts());
  return kind === "panel" || kind === "plataforma";
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
