/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Los despliegues de Preview (rama dev, con datos de prueba) no se indexan: noindex en
  // TODAS las respuestas, incluido el sitio público de cada academia. Se evalúa en cada
  // build, así que un build de producción nunca lo lleva. (ADR 037; lib/seo.ts)
  async headers() {
    if (process.env.VERCEL_ENV !== "preview") return [];
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }] }];
  },
};

export default nextConfig;
