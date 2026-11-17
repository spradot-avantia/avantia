// Proxy de PostHog (ADR 040): el navegador habla con /ingest del mismo dominio de la academia.
const POSTHOG_HOST = (process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com").replace(/\/$/, "");
const POSTHOG_ASSETS = POSTHOG_HOST.replace("://us.i.", "://us-assets.i.").replace("://eu.i.", "://eu-assets.i.");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      { source: "/ingest/static/:path*", destination: `${POSTHOG_ASSETS}/static/:path*` },
      { source: "/ingest/:path*", destination: `${POSTHOG_HOST}/:path*` },
    ];
  },
  // Los despliegues de Preview (rama dev, con datos de prueba) no se indexan: noindex en
  // TODAS las respuestas, incluido el sitio público de cada academia. Se evalúa en cada
  // build, así que un build de producción nunca lo lleva. (ADR 037; lib/seo.ts)
  async headers() {
    if (process.env.VERCEL_ENV !== "preview") return [];
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }] }];
  },
};

export default nextConfig;
