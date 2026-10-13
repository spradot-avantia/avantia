"use server";

// Alta de academia (RQ-02). Usa SIEMPRE el cliente con sesion (RLS + auth.uid()
// dentro de la RPC); jamas el cliente admin. El tenant_id nunca viene del
// cliente: lo genera la base y la membresia se ata a auth.uid().
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "../supabase/server";
import { derivarSubdominio, errorSubdominio, mapearErrorAlta, normalizarSubdominio } from "./alta";
import type { Resultado } from "./types";
import { areaAcademia, fraseAcademia, nombreAcademia } from "./validacion";

const altaSchema = z.object({
  nombre: nombreAcademia,
  subdomain: z.string().max(80).optional(),
  frase: fraseAcademia.optional().default(""),
  area: areaAcademia.optional().default(""),
});

export async function crearAcademiaAction(input: {
  nombre: string;
  subdomain?: string;
  frase?: string;
  area?: string;
}): Promise<Resultado<{ subdomain: string }>> {
  const p = altaSchema.safeParse(input);
  if (!p.success) {
    const campos: Record<string, string> = {};
    for (const i of p.error.issues) campos[String(i.path[0])] = i.message;
    return { ok: false, error: p.error.issues[0]?.message ?? "Datos inválidos.", campos };
  }
  const sub = normalizarSubdominio(p.data.subdomain?.trim() ? p.data.subdomain : derivarSubdominio(p.data.nombre));
  const motivo = errorSubdominio(sub);
  if (motivo) return { ok: false, error: motivo, campos: { subdomain: motivo } };

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.rpc("crear_academia", {
      p_nombre: p.data.nombre,
      p_subdomain: sub,
      p_frase: p.data.frase || null,
      p_area: p.data.area || null,
    });
    if (error) {
      const m = mapearErrorAlta(error);
      if (m.codigo === "desconocido") console.error("[alta] crear_academia falló", error);
      const deSubdominio =
        m.codigo === "subdominio_tomado" || m.codigo === "subdominio_reservado" || m.codigo === "subdominio_invalido";
      return { ok: false, error: m.mensaje, campos: deSubdominio ? { subdomain: m.mensaje } : undefined };
    }
    const creado = (data as { subdomain?: string } | null)?.subdomain ?? sub;
    revalidatePath("/", "layout");
    return { ok: true, data: { subdomain: creado } };
  } catch (e) {
    console.error("[alta] acción falló", e);
    return { ok: false, error: "No pudimos crear tu academia. Inténtalo de nuevo." };
  }
}

/**
 * Validacion en vivo. Anti-enumeracion: requiere sesion (la RPC lo exige) y
 * responde solo disponible / no disponible (+ motivo de FORMATO, que es regla
 * publica). No expone datos del tenant que ocupa el nombre. Pendiente Etapa 2:
 * limite de tasa por usuario.
 */
export async function comprobarSubdominioAction(
  subdomain: string,
): Promise<Resultado<{ disponible: boolean; motivo?: string }>> {
  const sub = normalizarSubdominio(String(subdomain ?? "").slice(0, 80));
  const motivo = errorSubdominio(sub);
  if (motivo) return { ok: true, data: { disponible: false, motivo } };
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.rpc("subdominio_disponible", { p_subdomain: sub });
    if (error) {
      const m = mapearErrorAlta(error);
      return {
        ok: false,
        error: m.codigo === "no_autenticado" ? m.mensaje : "No pudimos comprobar el nombre. Inténtalo de nuevo.",
      };
    }
    return data === true
      ? { ok: true, data: { disponible: true } }
      : { ok: true, data: { disponible: false, motivo: "Ese nombre ya está tomado, elige otro." } };
  } catch (e) {
    console.error("[alta] comprobación falló", e);
    return { ok: false, error: "No pudimos comprobar el nombre. Inténtalo de nuevo." };
  }
}
