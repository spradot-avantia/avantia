import "../../../../estado.css";

// Esqueleto genérico mientras cargan las rutas; lo heredan todos los grupos.
export default function Cargando() {
  return (
    <div className="es-carga" role="status" aria-live="polite">
      <span className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Cargando…</span>
      <div className="es-carga__fila es-carga__fila--t" />
      <div className="es-carga__fila es-carga__fila--s" />
      <div className="es-carga__fila es-carga__fila--c" />
      <div className="es-carga__fila es-carga__fila--c" />
    </div>
  );
}
