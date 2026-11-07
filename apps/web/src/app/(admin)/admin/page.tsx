import Link from "next/link";
import { supabaseAdmin } from "../../../lib/supabase/admin";

export const dynamic = "force-dynamic";

async function contar(tabla: string, filtro?: [string, string]): Promise<number> {
  let q = supabaseAdmin.from(tabla).select("*", { count: "exact", head: true });
  if (filtro) q = q.eq(filtro[0], filtro[1]);
  const { count, error } = await q;
  if (error) console.error("[admin] contar", tabla, error.code ?? error.message);
  return count ?? 0;
}

// Resumen de la plataforma. Es la única zona que cuenta entre todas las academias
// (intencional: es el equipo de Avantia, ver ADR 017).
export default async function AdminResumenPage() {
  const [nuevas, aceptadas, creadores, academias, cursos] = await Promise.all([
    contar("postulaciones", ["estado", "nueva"]),
    contar("postulaciones", ["estado", "aceptada"]),
    contar("membresias"),
    contar("tenants"),
    contar("cursos"),
  ]);

  const tarjetas = [
    { href: "/admin/postulaciones?estado=nueva", n: nuevas, label: "Postulaciones nuevas" },
    { href: "/admin/postulaciones?estado=aceptada", n: aceptadas, label: "Postulaciones aceptadas" },
    { href: "/admin/creadores", n: creadores, label: "Creadores con academia" },
    { href: "/admin/academias", n: academias, label: "Academias" },
    { href: "/admin/academias", n: cursos, label: "Cursos en total" },
  ];

  return (
    <>
      <h1 className="ad-h1">Resumen</h1>
      <p className="ad-lede">Estado de la plataforma. Aquí gestionas postulaciones, creadores, academias y al equipo.</p>
      <div className="ad-stats">
        {tarjetas.map((t) => (
          <Link key={t.label} href={t.href} className="ad-stat">
            <strong>{t.n}</strong>
            <span>{t.label}</span>
          </Link>
        ))}
      </div>
      {nuevas > 0 && (
        <p className="ad-msg">
          Tienes {nuevas} {nuevas === 1 ? "postulación" : "postulaciones"} sin revisar. <Link href="/admin/postulaciones?estado=nueva">Revisar ahora</Link>
        </p>
      )}
    </>
  );
}
