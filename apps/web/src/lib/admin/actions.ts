"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUsuarioActual } from "../auth/usuario";
import { correoEsStaff, esStaff } from "../staff";
import { supabaseAdmin } from "../supabase/admin";

/**
 * Acciones de la zona /admin (ADR 017). TODAS verifican esStaff() en el propio
 * servidor: un Server Action es un endpoint público aunque la página esté
 * protegida por el layout. Solo reciben ids/correos del equipo, nunca tenant_id.
 */

const SUSPENSION = "876000h"; // ~100 años: Supabase Auth no tiene "ban indefinido".
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function volver(ruta: string, aviso: string): never {
  revalidatePath(ruta);
  redirect(`${ruta}?aviso=${aviso}`);
}

function texto(fd: FormData, k: string): string {
  const v = fd.get(k);
  return typeof v === "string" ? v.trim() : "";
}

/** Suspende o reactiva la cuenta de un creador (no se puede sobre el equipo ni sobre uno mismo). */
export async function cambiarSuspensionCreadorAction(fd: FormData): Promise<void> {
  if (!(await esStaff())) return;
  const id = texto(fd, "id");
  const suspender = texto(fd, "accion") === "suspender";
  if (!id) return;

  const yo = await getUsuarioActual();
  if (yo?.id === id) volver("/admin/creadores", "no_a_ti");

  const { data, error } = await supabaseAdmin.auth.admin.getUserById(id);
  if (error || !data.user) volver("/admin/creadores", "error");
  if (await correoEsStaff(data.user.email)) volver("/admin/creadores", "es_equipo");

  const { error: errUpd } = await supabaseAdmin.auth.admin.updateUserById(id, {
    ban_duration: suspender ? SUSPENSION : "none",
  });
  if (errUpd) {
    console.error("[admin] suspensión", errUpd.message);
    volver("/admin/creadores", "error");
  }
  volver("/admin/creadores", suspender ? "suspendido" : "reactivado");
}

export async function agregarStaffAction(fd: FormData): Promise<void> {
  if (!(await esStaff())) return;
  const email = texto(fd, "email").toLowerCase();
  if (!CORREO.test(email) || email.length > 200) volver("/admin/equipo", "correo_invalido");

  // Si ya era del equipo se dice, en vez de repetir «Listo» como si fuera un alta nueva.
  const { data: existente } = await supabaseAdmin.from("staff").select("email").eq("email", email).maybeSingle();
  if (existente) volver("/admin/equipo", "ya_era");

  const yo = await getUsuarioActual();
  const { error } = await supabaseAdmin
    .from("staff")
    .upsert({ email, created_by: yo?.email ?? null }, { onConflict: "email", ignoreDuplicates: true });
  if (error) {
    console.error("[admin] agregar staff", error.code ?? error.message);
    volver("/admin/equipo", "error");
  }
  volver("/admin/equipo", "agregado");
}

export async function quitarStaffAction(fd: FormData): Promise<void> {
  if (!(await esStaff())) return;
  const email = texto(fd, "email").toLowerCase();
  if (!email) return;

  const yo = await getUsuarioActual();
  if (yo?.email?.toLowerCase() === email) volver("/admin/equipo", "no_a_ti");

  // Siempre debe quedar al menos otra persona del equipo.
  const { count } = await supabaseAdmin.from("staff").select("email", { count: "exact", head: true });
  if ((count ?? 0) <= 1) volver("/admin/equipo", "ultimo");

  const { error } = await supabaseAdmin.from("staff").delete().eq("email", email);
  if (error) {
    console.error("[admin] quitar staff", error.code ?? error.message);
    volver("/admin/equipo", "error");
  }
  volver("/admin/equipo", "quitado");
}
