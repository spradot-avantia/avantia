// Presentación de un módulo (descripción y «Qué aprenderás»), compartida por la ficha pública del
// curso y la pantalla de módulo del alumno (ADR 032, punto 9): una sola fuente de las reglas de
// qué se muestra y de cómo se etiqueta para lectores de pantalla. Cambia solo el contenedor visual.
import type { Modulo } from "../../lib/creador/types";

export function DescripcionModulo({ texto, className }: { texto: string | null; className: string }) {
  return texto ? <p className={className}>{texto}</p> : null;
}

export function ObjetivosModulo({ modulo, variante }: { modulo: Pick<Modulo, "id" | "objetivos">; variante: "ficha" | "alumno" }) {
  const objetivos = modulo.objetivos.filter((o) => o.trim());
  if (objetivos.length === 0) return null;
  const id = `obj-modulo-${modulo.id}`;
  const lista = objetivos.map((o, i) => <li key={i}>{o}</li>);
  if (variante === "ficha") {
    return (
      <>
        <p className="fc-mod__sub" id={id}>
          Qué aprenderás
        </p>
        <ul className="fc-obj fc-obj--mod" aria-labelledby={id}>
          {lista}
        </ul>
      </>
    );
  }
  return (
    <section className="al-card al-mp__aprenderas" aria-labelledby={id}>
      <h2 id={id}>Qué aprenderás</h2>
      <ul>{lista}</ul>
    </section>
  );
}
