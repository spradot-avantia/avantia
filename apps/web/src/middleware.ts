import { NextResponse, type NextRequest } from "next/server";
import { classifyHost } from "./lib/tenant/host";

const PANEL_HOST_SUFFIX = process.env.PANEL_HOST_SUFFIX ?? "app.avantia.app";
const MARKETING_HOSTS = (process.env.MARKETING_HOSTS ?? "avantia.app,www.avantia.app")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);

/**
 * Corre en el edge, antes de cualquier render. Decide entre las dos familias
 * de rutas del proyecto según el hostname de la request:
 *  - avantia.app / www.avantia.app: sitio de marketing; "/" muestra la landing
 *    (app/(marketing)/landing).
 *  - app.avantia.app (o localhost): panel interno -> app/(dashboard).
 *  - cualquier otro dominio: sitio público de una academia -> app/(public),
 *    reescrito hacia el segmento real [domain] para que el route group
 *    reciba el hostname como parámetro.
 *
 * No consulta la base de datos acá (eso es costoso en cada request de edge):
 * la existencia real del tenant se resuelve en app/(public)/[domain]/layout.tsx,
 * un Server Component que corre en runtime Node.js.
 */
export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host")?.split(":")[0] ?? "";

  const kind = classifyHost(hostname, {
    panelHost: PANEL_HOST_SUFFIX,
    marketingHosts: MARKETING_HOSTS,
  });

  if (kind === "marketing") {
    if (request.nextUrl.pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/landing";
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  if (kind === "panel") {
    return NextResponse.next();
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
