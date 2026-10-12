import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "../supabase/server";
import type { LogoModo, TenantCreador } from "./types";

/**
 * Contexto del Espacio del Creador: tenant actual + cliente de base de datos.
 *
 * REGLA: el tenant se deriva de la sesion (membresia) o del entorno, NUNCA de
 * un parametro del request/body. Todos los repos reciben este contexto y
 * filtran explicitamente por `tenant.id`.
 *
 * TODO(RQ-01, sesion real): hoy, si no hay usuario autenticado, se usa
 * DEMO_TENANT_SLUG (provisional, ver Supuestos_y_Pendientes.md). En ese modo
 * RLS no puede resolver auth_tenant_id() (no hay auth.uid()), asi que se usa
 * el cliente admin de forma INEVITABLE y acotada: siempre con .eq("tenant_id",
 * tenant.id). Al llegar el login con Google, se elimina la rama demo y todo
 * pasa por el cliente con sesion + RLS.
 */
export interface CreadorContext {
  tenant: TenantCreador;
  db: SupabaseClient;
  /** "sesion" = cliente con RLS; "demo" = admin provisional. */
  modo: "sesion" | "demo";
}

const COLUMNAS =
  "id, slug, subdomain, custom_domain, nombre, frase, area, color_primario, logo_url, logo_modo, pais, moneda, onboarding_completado_at";

function mapTenant(r: any): TenantCreador {
  return {
    id: r.id,
    slug: r.slug,
    subdomain: r.subdomain,
    customDomain: r.custom_domain,
    nombre: r.nombre,
    frase: r.frase,
    area: r.area,
    colorPrimario: r.color_primario ?? "#2563eb",
    logoUrl: r.logo_url,
    logoModo: (r.logo_modo ?? "logo_y_nombre") as LogoModo,
    pais: r.pais,
    moneda: r.moneda,
    onboardingCompletado: !!r.onboarding_completado_at,
  };
}

/** Devuelve el contexto o null si no hay tenant (sin sesion y sin DEMO_TENANT_SLUG valido). */
export const getCreadorContext = cache(async (): Promise<CreadorContext | null> => {
  const supabase = createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (auth.user) {
    // RLS limita tenants a auth_tenant_id(); aun asi tomamos el unico visible.
    const { data } = await supabase.from("tenants").select(COLUMNAS).limit(1).maybeSingle();
    if (data) return { tenant: mapTenant(data), db: supabase, modo: "sesion" };
    return null;
  }

  const demoSlug = process.env.DEMO_TENANT_SLUG;
  if (!demoSlug) return null;
  const { supabaseAdmin } = await import("../supabase/admin");
  const { data } = await supabaseAdmin.from("tenants").select(COLUMNAS).eq("subdomain", demoSlug).maybeSingle();
  if (!data) return null;
  return { tenant: mapTenant(data), db: supabaseAdmin, modo: "demo" };
});

/** Tenant de la academia en curso (null si no hay). Para layouts y paginas. */
export async function getCurrentTenant(): Promise<TenantCreador | null> {
  return (await getCreadorContext())?.tenant ?? null;
}

/** Igual que getCreadorContext pero lanza si no hay tenant (para repos/acciones). */
export async function requireCreadorContext(): Promise<CreadorContext> {
  const ctx = await getCreadorContext();
  if (!ctx) throw new SinTenantError();
  return ctx;
}

export class SinTenantError extends Error {
  constructor() {
    super("No hay una academia activa. Inicia sesión o define DEMO_TENANT_SLUG.");
    this.name = "SinTenantError";
  }
}

export { COLUMNAS as COLUMNAS_TENANT, mapTenant };
