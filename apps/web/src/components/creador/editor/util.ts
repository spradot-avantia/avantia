import type { EditorCtx } from "./contexto";

/**
 * Error a mostrar junto a un campo: solo despues de salir del campo (blur) o
 * si el contenido ya excede el limite (`forzar`), para no regañar mientras se escribe.
 */
export function errorDe(ctx: EditorCtx, campo: string, forzar = false): string | undefined {
  return ctx.tocado[campo] || forzar ? ctx.erroresCampo[campo] : undefined;
}

/** Clase para contadores que ya superaron el limite. */
export function contador(n: number, max: number): string {
  return `${n}/${max}`;
}
