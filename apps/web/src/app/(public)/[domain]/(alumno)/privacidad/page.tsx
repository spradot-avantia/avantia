import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrivacidadAcademia } from "../../../../../components/alumno/PaginaLegal";
import { getTenantPublico } from "../../../../../lib/alumno/contexto";

export const metadata: Metadata = { title: "Privacidad" };
export const dynamic = "force-dynamic";

export default async function PrivacidadPage() {
  const tenant = await getTenantPublico();
  if (!tenant) notFound();
  return <PrivacidadAcademia academia={tenant.nombre} />;
}
