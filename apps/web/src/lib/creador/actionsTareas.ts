"use server";

// Server Actions del creador para tareas, revisiones y clases en vivo (ADR 038 y 039).
// Ninguna recibe tenant_id: sale de la sesión (tenantActual.ts).
import { revalidatePath } from "next/cache";
import type { EntradaClase, EntradaTarea } from "../tareas/reglas";
import { eliminarClase, guardarClase, type ClaseCreador } from "./clases";
import { eliminarTarea, guardarRevision, guardarTarea, tareaDeLeccion, type TareaCreador } from "./tareas";
import type { Resultado } from "./types";

async function seguro<T>(fn: () => Promise<Resultado<T>>): Promise<Resultado<T>> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof Error && e.name === "SinTenantError") return { ok: false, error: e.message };
    console.error("[creador/tareas] acción falló", e);
    return { ok: false, error: "Algo salió mal. Inténtalo de nuevo." };
  }
}

export async function obtenerTareaAction(leccionId: string): Promise<Resultado<TareaCreador | null>> {
  return seguro(() => tareaDeLeccion(leccionId));
}

export async function guardarTareaAction(leccionId: string, entrada: EntradaTarea): Promise<Resultado<TareaCreador>> {
  return seguro(() => guardarTarea(leccionId, entrada));
}

export async function eliminarTareaAction(tareaId: string): Promise<Resultado> {
  return seguro(() => eliminarTarea(tareaId));
}

export async function guardarRevisionAction(
  entregaId: string,
  entrada: { puntaje: string; comentario: string },
  publicar: boolean,
): Promise<Resultado<{ publicada: boolean }>> {
  const r = await seguro(() => guardarRevision(entregaId, entrada, publicar));
  if (r.ok) revalidatePath("/revisiones");
  return r;
}

export async function guardarClaseAction(claseId: string | null, cursoId: string, entrada: EntradaClase): Promise<Resultado<ClaseCreador>> {
  const r = await seguro(() => guardarClase(claseId, cursoId, entrada));
  if (r.ok) revalidatePath("/clases");
  return r;
}

export async function eliminarClaseAction(claseId: string): Promise<Resultado> {
  const r = await seguro(() => eliminarClase(claseId));
  if (r.ok) revalidatePath("/clases");
  return r;
}
