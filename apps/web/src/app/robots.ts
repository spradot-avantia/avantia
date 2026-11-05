import type { MetadataRoute } from "next";
import { SITE_URL } from "../lib/seo";

// /login y /signup NO se bloquean aquí: en Disallow Google no podría leer su
// noindex y seguirían apareciendo. Solo se cierran el panel y la API.
export default function robots(): MetadataRoute.Robots {
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
