import type { MetadataRoute } from "next";
import { SITE_URL, esDespliegueDePreview } from "../lib/seo";

// /login y /signup NO se bloquean aquí: en Disallow Google no podría leer su
// noindex y seguirían apareciendo. Solo se cierran el panel y la API.
// Excepción: en los despliegues de Preview (dev) se cierra todo y no se anuncia sitemap.
export default function robots(): MetadataRoute.Robots {
  if (esDespliegueDePreview()) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/inicio", "/cursos", "/estudiantes", "/configuracion", "/mi-academia", "/admin", "/onboarding"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
