import { infoTemplate, type ClaveTemplate } from "../../../lib/creador/paginaReglas";

/** Miniatura de un template (decorativa). */
export function MiniTemplate({ clave, color }: { clave: ClaveTemplate; color: string }) {
  const m = infoTemplate(clave).mini;
  return (
    <span className="pg-mini" style={{ background: m.fondo }} aria-hidden="true">
      <span style={{ width: "80%", height: 7, background: m.titulo }} />
      <span style={{ width: "55%", height: 7, background: m.titulo, marginTop: 5 }} />
      <span style={{ width: "70%", height: 4, background: m.linea, marginTop: 8 }} />
      <span style={{ width: "40%", height: 10, background: m.boton ?? color, marginTop: 10 }} />
    </span>
  );
}