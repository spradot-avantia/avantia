/**
 * Reglas de contraseña (puras, sin dependencias: se usan en cliente y servidor).
 * Regla dura: largo >= 10 (NIST 800-63B: el largo pesa más que las
 * combinaciones). El indicador es orientativo y NO bloquea más allá del largo.
 */
export const LARGO_MIN_CONTRASENA = 10;
export const LARGO_MAX_CONTRASENA = 72; // bcrypt trunca a 72 bytes

export type NivelContrasena = "vacia" | "corta" | "aceptable" | "buena" | "fuerte";

export interface EvaluacionContrasena {
  cumple: boolean;
  nivel: NivelContrasena;
  /** 0 a 4, para pintar la barra. */
  puntaje: number;
  etiqueta: string;
  /** Qué falta, en español, o null si no hay nada que corregir. */
  ayuda: string | null;
}

const COMUNES = ["contrasena", "contraseña", "password", "123456789", "1234567890", "qwertyuiop", "abcdefghij", "avantia"];

export function evaluarContrasena(valor: string): EvaluacionContrasena {
  if (!valor) {
    return { cumple: false, nivel: "vacia", puntaje: 0, etiqueta: "", ayuda: `Usa al menos ${LARGO_MIN_CONTRASENA} caracteres.` };
  }
  if (valor.length < LARGO_MIN_CONTRASENA) {
    const faltan = LARGO_MIN_CONTRASENA - valor.length;
    return {
      cumple: false,
      nivel: "corta",
      puntaje: 1,
      etiqueta: "Muy corta",
      ayuda: `Agrega ${faltan} ${faltan === 1 ? "carácter" : "caracteres"} más (mínimo ${LARGO_MIN_CONTRASENA}).`,
    };
  }
  const minus = valor.toLowerCase();
  const comun = COMUNES.some((c) => minus.includes(c)) || /^(.)\1+$/.test(valor);
  const clases = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(valor)).length;
  let puntaje = 2;
  if (valor.length >= 14 || clases >= 3) puntaje = 3;
  if (valor.length >= 14 && clases >= 3) puntaje = 4;
  if (comun) puntaje = Math.min(puntaje, 2);
  const nivel: NivelContrasena = puntaje <= 2 ? "aceptable" : puntaje === 3 ? "buena" : "fuerte";
  const etiqueta = { aceptable: "Aceptable", buena: "Buena", fuerte: "Fuerte" }[nivel];
  return {
    cumple: true,
    nivel,
    puntaje,
    etiqueta,
    ayuda: comun ? "Es una contraseña muy común; mejor combina palabras que solo tú recuerdes." : null,
  };
}
