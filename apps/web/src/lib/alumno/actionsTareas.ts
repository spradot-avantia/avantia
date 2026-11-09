"use server";

// Server Actions del alumno para entregar tareas (ADR 038). El tenant sale del host y el alumno
// de su sesión; lo que llega del cliente (tareaId, ruta) se vuelve a comprobar en `tareas.ts`.
import type { Resultado } from "../creador/types";
import { confirmarEntrega, prepararEntrega } from "./tareas";

async function seguro<T>(fn: () => Promise<Resultado<T>>): Promise<Resultado<T>> {
  try {
    return await fn();
  } catch (e) {
    console.error("[alumno/tareas] acción falló", e);
    return { ok: false, error: "Algo salió mal. Inténtalo de nuevo." };
  }
}

export async function prepararEntregaAction(tareaId: string, archivo: { nombre: string; bytes: number }) {
  return seguro(() => prepararEntrega(tareaId, archivo));
}

export async function confirmarEntregaAction(tareaId: string, ruta: string, nombreOriginal: string, comentario: string) {
  return seguro(() => confirmarEntrega(tareaId, ruta, nombreOriginal, comentario));
}
