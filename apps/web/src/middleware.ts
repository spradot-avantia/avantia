import { NextResponse, type NextRequest } from "next/server";

const PANEL_HOST_SUFFIX = process.env.PANEL_HOST_SUFFIX ?? "app.avantia.app";

/**
 * Corre en el edge, antes de cualquier render. Decide entre las dos familias
 * de rutas del proyecto según el hostname de la request:
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

  const isPanelHost =
    hostname === "localhost" || hostname.endsWith(PANEL_HOST_SUFFIX);

  if (isPanelHost) {
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
