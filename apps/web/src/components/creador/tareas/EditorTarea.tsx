"use client";

// Tarea con entrega de una lección (ADR 038): título, instrucciones (admiten LaTeX), puntaje
// máximo libre, fecha límite y reenvío. Se carga al abrir la sección y se guarda con un botón.
import { useId, useState } from "react";
import { eliminarTareaAction, guardarTareaAction, obtenerTareaAction } from "../../../lib/creador/actionsTareas";
import type { TareaCreador } from "../../../lib/creador/tareas";
import { formatearPuntaje } from "../../../lib/tareas/reglas";
import { Button } from "../Button";
import { Field, Input, Textarea } from "../Field";
import { ConfirmDialog } from "../editor/ConfirmDialog";
import "./tareas.css";

const VACIA = { titulo: "", instrucciones: "", puntaje: "", limite: "", reenvio: true };

export function EditorTarea({ leccionId, tituloLeccion }: { leccionId: string; tituloLeccion: string }) {
  const uid = useId();
  const [cargada, setCargada] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [tarea, setTarea] = useState<TareaCreador | null>(null);
  const [f, setF] = useState(VACIA);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ texto: string; error?: boolean } | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [quitando, setQuitando] = useState(false);

  function aplicar(t: TareaCreador | null) {
    setTarea(t);
    setF(
      t
        ? { titulo: t.titulo, instrucciones: t.instrucciones, puntaje: formatearPuntaje(t.puntajeMaximo), limite: t.fechaLimite, reenvio: t.permiteReenvio }
        : { ...VACIA, titulo: `Ejercicios: ${tituloLeccion}`.slice(0, 120) },
    );
  }

  async function alAbrir(abierto: boolean) {
    if (!abierto || cargada || cargando) return;
    setCargando(true);
    const r = await obtenerTareaAction(leccionId);
    setCargando(false);
    if (!r.ok) {
      setMsg({ texto: r.error, error: true });
      return;
    }
    aplicar(r.data);
    setCargada(true);
  }

  async function guardar() {
    setGuardando(true);
    setMsg(null);
    const r = await guardarTareaAction(leccionId, {
      titulo: f.titulo,
      instrucciones: f.instrucciones,
      puntajeMaximo: f.puntaje,
      fechaLimite: f.limite,
      permiteReenvio: f.reenvio,
    });
    setGuardando(false);
    if (!r.ok) {
      setErrores(r.campos ?? {});
      setMsg({ texto: r.error, error: true });
      return;
    }
    setErrores({});
    aplicar(r.data);
    setMsg({ texto: "Tarea guardada." });
  }

  async function quitar() {
    if (!tarea) return;
    setQuitando(false);
    setGuardando(true);
    const r = await eliminarTareaAction(tarea.id);
    setGuardando(false);
    if (!r.ok) {
      setMsg({ texto: r.error, error: true });
      return;
    }
    aplicar(null);
    setMsg({ texto: "Tarea quitada." });
  }

  const set = (k: keyof typeof VACIA) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));

  return (
    <details className="tr-details" onToggle={(e) => alAbrir((e.target as HTMLDetailsElement).open)}>
      <summary className="tr-sum">Tarea con entrega (opcional){tarea ? " · activa" : ""}</summary>
      {cargando && <p className="tr-status" role="status">Cargando…</p>}
      {cargada && (
        <div className="tr-box">
          <p className="tr-hint">
            El alumno sube un archivo con sus ejercicios; tú lo revisas en «Revisiones», le pones puntaje y comentarios. Las instrucciones aceptan
            fórmulas LaTeX con $...$.
          </p>
          <Field id={`${uid}-t`} label="Título de la tarea" error={errores.titulo}>
            <Input id={`${uid}-t`} value={f.titulo} maxLength={120} invalido={!!errores.titulo} onChange={set("titulo")} />
          </Field>
          <Field id={`${uid}-i`} label="Instrucciones" opcional error={errores.instrucciones}>
            <Textarea id={`${uid}-i`} className="tr-textarea" value={f.instrucciones} invalido={!!errores.instrucciones} onChange={set("instrucciones")} />
          </Field>
          <div className="tr-grid">
            <Field id={`${uid}-p`} label="Puntaje máximo" ayuda="Tú defines la escala, por ejemplo 30." error={errores.puntajeMaximo}>
              <Input id={`${uid}-p`} inputMode="decimal" value={f.puntaje} conAyuda invalido={!!errores.puntajeMaximo} onChange={set("puntaje")} />
            </Field>
            <Field id={`${uid}-l`} label="Fecha límite" opcional ayuda="Hora de Chile. Se puede entregar después, pero queda marcada como atrasada." error={errores.fechaLimite}>
              <Input id={`${uid}-l`} type="datetime-local" value={f.limite} conAyuda invalido={!!errores.fechaLimite} onChange={set("limite")} />
            </Field>
          </div>
          <label className="tr-check">
            <input type="checkbox" checked={f.reenvio} onChange={(e) => setF((x) => ({ ...x, reenvio: e.target.checked }))} />
            Permitir que el alumno reenvíe su entrega
          </label>
          <div className="tr-actions">
            <Button onClick={guardar} disabled={guardando}>
              {guardando ? "Guardando…" : tarea ? "Guardar cambios" : "Crear tarea"}
            </Button>
            {tarea && (
              <Button variante="danger" onClick={() => setQuitando(true)} disabled={guardando}>
                Quitar tarea
              </Button>
            )}
          </div>
          <p className={`tr-status${msg?.error ? " tr-status--error" : ""}`} role={msg?.error ? "alert" : "status"}>
            {msg?.texto}
          </p>
          <ConfirmDialog
            abierto={quitando}
            titulo="¿Quitar esta tarea?"
            confirmar="Quitar tarea"
            peligro
            onConfirmar={quitar}
            onCancelar={() => setQuitando(false)}
          >
            <p>
              {tarea && tarea.totalEntregas > 0
                ? `Se borrarán también las ${tarea.totalEntregas} entregas de los alumnos, sus archivos y sus revisiones. No se puede deshacer.`
                : "La lección queda sin tarea."}
            </p>
          </ConfirmDialog>
        </div>
      )}
      {!cargada && msg?.error && <p className="tr-status tr-status--error" role="alert">{msg.texto}</p>}
    </details>
  );
}
