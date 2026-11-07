import { esDespliegueDePreview } from "../../../../lib/seo";

// robots.txt de cada academia (el middleware reescribe /robots.txt de un host de tenant hacia aquí).
// Antes respondía 404. Se cierran las pantallas privadas del alumno; el sitio público y las fichas
// de curso quedan abiertas. En Preview (dev) se cierra todo (ADR 037).
export const dynamic = "force-dynamic";

const PRIVADAS = ["/aprender/", "/mis-cursos", "/perfil", "/progreso", "/repaso", "/checkout", "/confirmar", "/restablecer"];

export function GET() {
  const cuerpo = esDespliegueDePreview()
    ? "User-agent: *\nDisallow: /\n"
    : `User-agent: *\nAllow: /\n${PRIVADAS.map((r) => `Disallow: ${r}`).join("\n")}\n`;
  return new Response(cuerpo, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
