import "../creador.css";
import "./marca.css";

/** "Cambios sin guardar" / "Guardado" (región viva para lectores de pantalla). */
export function IndicadorGuardado({ sucio, guardando }: { sucio: boolean; guardando?: boolean }) {
  return (
    <span className={`mk-save${sucio ? " mk-save--dirty" : ""}`} role="status" aria-live="polite">
      {guardando ? "Guardando…" : sucio ? "Cambios sin guardar" : "✓ Guardado"}
    </span>
  );
}
