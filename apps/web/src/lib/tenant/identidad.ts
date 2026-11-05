// Identidad visual por academia más allá del color (ADR 027): tipografía y forma.
// Módulo puro (sin next/font) para poder usarlo en servidor, cliente y tests.
// Listas cerradas: lo que no esté aquí no se acepta ni se guarda.

export const TIPOGRAFIAS = ["clasico", "moderno", "cercano", "editorial"] as const;
export type Tipografia = (typeof TIPOGRAFIAS)[number];

export const FORMAS = ["recta", "suave"] as const;
export type Forma = (typeof FORMAS)[number];

/** Los defaults reproducen la apariencia que tenían las academias antes del ADR 027. */
export const TIPOGRAFIA_DEFECTO: Tipografia = "clasico";
export const FORMA_DEFECTO: Forma = "suave";

export function esTipografia(v: unknown): v is Tipografia {
  return typeof v === "string" && (TIPOGRAFIAS as readonly string[]).includes(v);
}
export function esForma(v: unknown): v is Forma {
  return typeof v === "string" && (FORMAS as readonly string[]).includes(v);
}

/** Valor de la base -> valor seguro (si viene nulo o desconocido, el default). */
export function tipografiaDe(v: unknown): Tipografia {
  return esTipografia(v) ? v : TIPOGRAFIA_DEFECTO;
}
export function formaDe(v: unknown): Forma {
  return esForma(v) ? v : FORMA_DEFECTO;
}

/** Clases CSS de identidad (definidas en styles/identidad-tenant.css) para el contenedor raíz. */
export function clasesIdentidad(tipografia: unknown, forma: unknown): string {
  return `tn-tipo-${tipografiaDe(tipografia)} tn-forma-${formaDe(forma)}`;
}

export const OPCIONES_TIPOGRAFIA: Record<Tipografia, { nombre: string; detalle: string }> = {
  clasico: { nombre: "Clásica", detalle: "Inter, neutra y legible (la de siempre)" },
  moderno: { nombre: "Moderna", detalle: "Geométrica, limpia y actual" },
  cercano: { nombre: "Cercana", detalle: "Redondeada, amable y cálida" },
  editorial: { nombre: "Editorial", detalle: "Titulares con serif, como una revista" },
};

export const OPCIONES_FORMA: Record<Forma, { nombre: string; detalle: string }> = {
  suave: { nombre: "Suave", detalle: "Esquinas redondeadas (la de siempre)" },
  recta: { nombre: "Recta", detalle: "Esquinas casi rectas, más serio" },
};
