"use client";

// Formulario de entrega de una tarea (ADR 038): elige el archivo, lo sube directo al bucket
// privado con una URL firmada que emite el servidor y registra la entrega. El servidor repite
// todas las validaciones; esto solo es el camino.
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { confirmarEntregaAction, prepararEntregaAction } from "../../lib/alumno/actionsTareas";
import { subirArchivoAlBucket } from "../../lib/creador/subidaCliente";
import { formatearBytes } from "../../lib/creador/archivosReglas";
import { ACCEPT_ENTREGA, COMENTARIO_ALUMNO_MAX, LEGIBLE_ENTREGA, validarArchivoEntrega } from "../../lib/tareas/reglas";
import "./alumno.css";

export function FormEntrega({ tareaId, reenvio }: { tareaId: string; reenvio: boolean }) {
  const uid = useId();
  const router = useRouter();
  const archivoRef = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [comentario, setComentario] = useState("");
  const [estado, setEstado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function elegir(f: File | null) {
    setError(null);
    setEstado(null);
    if (f) {
      const v = validarArchivoEntrega(f.name, f.size);
      if (!v.ok) {
        setError(v.error);
        setArchivo(null);
        if (archivoRef.current) archivoRef.current.value = "";
        return;
      }
    }
    setArchivo(f);
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!archivo || enviando) return;
    setEnviando(true);
    setError(null);
    const r = await subirArchivoAlBucket(
      archivo,
      {
        preparar: (a) => prepararEntregaAction(tareaId, a),
        confirmar: (ruta, nombre) => confirmarEntregaAction(tareaId, ruta, nombre, comentario),
        estado: setEstado,
      },
      "entregas",
    );
    setEnviando(false);
    if (!r.ok) {
      setEstado(null);
      setError(r.error);
      return;
    }
    setArchivo(null);
    setComentario("");
    if (archivoRef.current) archivoRef.current.value = "";
    setEstado("¡Entrega enviada! Tu profesor la revisará.");
    router.refresh();
  }

  return (
    <form onSubmit={enviar} className="al-stack">
      <div className="al-field">
        <label htmlFor={`${uid}-f`}>{reenvio ? "Archivo (puedes volver a enviar otra versión)" : "Archivo con tus ejercicios resueltos"}</label>
        <input
          id={`${uid}-f`}
          ref={archivoRef}
          type="file"
          accept={ACCEPT_ENTREGA}
          onChange={(e) => elegir(e.target.files?.[0] ?? null)}
          aria-describedby={`${uid}-ayuda`}
        />
        <span id={`${uid}-ayuda`} className="al-muted">
          {LEGIBLE_ENTREGA}, hasta 25 MB.{archivo ? ` Elegido: ${archivo.name} (${formatearBytes(archivo.size)}).` : ""}
        </span>
      </div>
      <div className="al-field">
        <label htmlFor={`${uid}-c`}>Mensaje para tu profesor (opcional)</label>
        <textarea id={`${uid}-c`} rows={3} maxLength={COMENTARIO_ALUMNO_MAX} value={comentario} onChange={(e) => setComentario(e.target.value)} />
      </div>
      <div>
        <button type="submit" className="al-btn" disabled={!archivo || enviando}>
          {enviando ? "Enviando…" : "Enviar entrega"}
        </button>
      </div>
      <p className="al-muted" role="status" aria-live="polite">
        {estado}
      </p>
      {error && (
        <p className="al-alert al-alert--error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
