import { iniciales } from "../../../lib/creador/color";
import "./avatares.css";

const PALETA = 7;

/** Número estable (0..6) a partir del texto: mismo nombre, mismo color. */
function indice(texto: string): number {
  let h = 2166136261;
  for (const ch of texto.toLowerCase()) h = Math.imul(h ^ ch.codePointAt(0)!, 16777619) >>> 0;
  return ((h ^ (h >>> 15)) >>> 0) % PALETA;
}

/** Avatar circular con iniciales; decorativo (el nombre ya está en el texto contiguo). */
export function Avatar({ nombre }: { nombre: string }) {
  const base = nombre.includes("@") ? nombre.split("@")[0].replace(/[._+-]+/g, " ") : nombre;
  return (
    <span className={`ea-ava ea-ava--${indice(nombre)}`} aria-hidden="true">
      {iniciales(base)}
    </span>
  );
}
