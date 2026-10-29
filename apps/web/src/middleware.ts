import { NextResponse, type NextRequest } from "next/server";
import { classifyHost } from "./lib/tenant/host";
import { refrescarSesionPanel } from "./lib/supabase/middleware";

const PANEL_HOST_SUFFIX = process.env.PANEL_HOST_SUFFIX ?? "app.avantia.app";
const MARKETING_HOSTS = (process.env.MARKETING_HOSTS ?? "avantia.app,www.avantia.app")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);
const PLATFORM_HOSTS = (process.env.PLATFORM_HOSTS ?? "")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);

/**
 * Corre en el edge, antes de cualquier render. Decide entre las dos familias
 * de rutas del proyecto según el hostname de la request:
 *  - avantia.app / www.avantia.app: sitio de marketing; "/" muestra la landing
 *    (app/(marketing)/landing).
 *  - PLATFORM_HOSTS (host único, ADR 012): landing y panel en el mismo dominio;
 *    "/" siempre es la landing; el panel entra por /login y vive en /inicio.
 *  - app.avantia.app (o localhost): panel interno -> app/(dashboard).
 *  - cualquier otro dominio: sitio público de una academia -> app/(public),
 *    reescrito hacia el segmento real [domain] para que el route group
 *    reciba el hostname como parámetro.
 *
 * En el host del panel además refresca la sesión de Supabase Auth (ver
 * lib/supabase/middleware.ts; una llamada a Auth solo si hay cookie de sesión).
 *
 * No consulta la base de datos acá (eso es costoso en cada request de edge):
 * la existencia real del tenant se resuelve en app/(public)/[domain]/layout.tsx,
 * un Server Component que corre en runtime Node.js.
 */
export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host")?.split(":")[0] ?? "";

  const kind = classifyHost(hostname, {
    panelHost: PANEL_HOST_SUFFIX,
    marketingHosts: MARKETING_HOSTS,
    platformHosts: PLATFORM_HOSTS,
  });

  if (kind === "plataforma") {
    // "/" siempre es la landing; el inicio del panel vive en /inicio.
    if (request.nextUrl.pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/landing";
      return NextResponse.rewrite(url);
    }
    return refrescarSesionPanel(request);
  }

  if (kind === "marketing") {
    if (request.nextUrl.pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/landing";
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  if (kind === "panel") {
    if (request.nextUrl.pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/inicio";
      return NextResponse.redirect(url);
    }
    // Único trabajo de sesión: refrescar cookies de Supabase (sin tocar tablas).
    return refrescarSesionPanel(request);
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${hostname}${request.nextUrl.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    /*
     * No aplica a rutas de la API, assets de Next.js ni archivos estáticos:
     * esas no dependen de qué tenant sea, y los webhooks de pago necesitan
     * llegar sin reescribir.
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
