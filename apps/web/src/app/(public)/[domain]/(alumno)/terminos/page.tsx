import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TerminosAcademia } from "../../../../../components/alumno/PaginaLegal";
import { getTenantPublico } from "../../../../../lib/alumno/contexto";

export const metadata: Metadata = { title: "Términos de uso" };
export const dynamic = "force-dynamic";

export default async function TerminosPage() {
  const tenant = await getTenantPublico();
  if (!tenant) notFound();
  return <TerminosAcademia academia={tenant.nombre} />;
}
