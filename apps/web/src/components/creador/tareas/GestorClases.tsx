"use client";

// Clases en vivo (ADR 039, Fase 1): el creador agenda la clase, pega el enlace de Meet y, después,
// la grabación y el resumen. Los alumnos del curso ven la próxima clase y lo que se vio.
import { useId, useState } from "react";
import { eliminarClaseAction, guardarClaseAction } from "../../../lib/creador/actionsTareas";
import type { ClaseCreador } from "../../../lib/creador/clases";
import { fechaHoraLarga, separarClases } from "../../../lib/tareas/reglas";
import { Badge } from "../Badge";
import { Button } from "../Button";
import { Field, Input, Select, Textarea } from "../Field";
import { ConfirmDialog } from "../editor/ConfirmDialog";
import "../inicio/inicio.css";
import "./tareas.css";

type Campos = { titulo: string; descripcion: string; inicia: string; duracion: string; meet: string; grabacion: string; resumen: string; cursoId: string };

export function GestorClases({ cursos, clasesIniciales }: { cursos: Array<{ id: string; titulo: string }>; clasesIniciales: ClaseCreador[] }) {
  const uid = useId();
  const [clases, setClases] = useState(clasesIniciales);
  const vacio = (): Campos => ({ titulo: "", descripcion: "", inicia: "", duracion: "60", meet: "", grabacion: "", resumen: "", cursoId: cursos[0]?.id ?? "" });
  const [editando, setEditando] = useState<string | "nueva" | null>(null);
  const [f, setF] = useState<Campos>(vacio);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ texto: string; error?: boolean } | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const [quitar, setQuitar] = useState<ClaseCreador | null>(null);

  const tituloCurso = new Map(cursos.map((c) => [c.id, c.titulo]));
  const { proximas, pasadas } = separarClases(clases);

  function abrir(c: ClaseCreador | null) {
    setErrores({});
    setMsg(null);
    setEditando(c ? c.id : "nueva");
    setF(c ? { titulo: c.titulo, descripcion: c.descripcion, inicia: c.inicia, duracion: String(c.duracionMin), meet: c.enlaceMeet, grabacion: c.grabacionUrl, resumen: c.resumen, cursoId: c.cursoId } : vacio());
  }

  async function guardar() {
    setTrabajando(true);
    setMsg(null);
    const r = await guardarClaseAction(editando === "nueva" ? null : editando, f.cursoId, {
      titulo: f.titulo,
      descripcion: f.descripcion,
      inicia: f.inicia,
      duracionMin: f.duracion,
      enlaceMeet: f.meet,
      grabacionUrl: f.grabacion,
      resumen: f.resumen,
    });
    setTrabajando(false);
    if (!r.ok) {
      setErrores(r.campos ?? {});
      setMsg({ texto: r.error, error: true });
      return;
    }
    setClases((cs) => [r.data, ...cs.filter((x) => x.id !== r.data.id)]);
    setEditando(null);
    setMsg({ texto: "Clase guardada." });
  }

  async function borrar() {
    if (!quitar) return;
    const c = quitar;
    setQuitar(null);
    const r = await eliminarClaseAction(c.id);
    if (!r.ok) {
      setMsg({ texto: r.error, error: true });
      return;
    }
    setClases((cs) => cs.filter((x) => x.id !== c.id));
    setMsg({ texto: "Clase quitada." });
  }

  const set = (k: keyof Campos) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));

  const fila = (c: ClaseCreador, pasada: boolean) => (
    <li key={c.id} className="ci-row">
      <div className="ci-row__main tr-clase">
        <span className="ci-row__title">{c.titulo}</span>
        <span className="tr-clase__meta">
          <span>{fechaHoraLarga(c.iniciaAt)}</span>
          <span>{c.duracionMin} min</span>
          <span>{tituloCurso.get(c.cursoId) ?? "Curso"}</span>
          {!c.enlaceMeet && !pasada && <Badge tono="warning">Falta el enlace de Meet</Badge>}
          {pasada && !c.grabacionUrl && !c.resumen && <Badge tono="neutral">Sin grabación ni resumen</Badge>}
          {pasada && (c.grabacionUrl || c.resumen) && <Badge tono="ok">Con material</Badge>}
        </span>
      </div>
      <div className="tr-actions">
        <Button variante="secondary" onClick={() => abrir(c)}>
          {pasada ? "Agregar grabación y resumen" : "Editar"}
        </Button>
        <Button variante="ghost" onClick={() => setQuitar(c)}>
          Quitar
        </Button>
      </div>
    </li>
  );

  return (
    <div className="ci-stack">
      {cursos.length === 0 ? (
        <p className="ci-muted">Primero crea un curso: las clases en vivo se agendan dentro de un curso.</p>
      ) : (
        <div className="tr-actions">
          <Button onClick={() => abrir(null)} disabled={editando === "nueva"}>
            Agendar una clase
          </Button>
        </div>
      )}

      {editando && (
        <section className="tr-panel" aria-labelledby={`${uid}-h`}>
          <h2 id={`${uid}-h`}>{editando === "nueva" ? "Nueva clase en vivo" : "Editar clase"}</h2>
          <Field id={`${uid}-c`} label="Curso" error={errores.cursoId}>
            <Select id={`${uid}-c`} value={f.cursoId} onChange={set("cursoId")}>
              {cursos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.titulo}
                </option>
              ))}
            </Select>
          </Field>
          <Field id={`${uid}-t`} label="Título" error={errores.titulo}>
            <Input id={`${uid}-t`} value={f.titulo} maxLength={120} invalido={!!errores.titulo} onChange={set("titulo")} />
          </Field>
          <div className="tr-grid">
            <Field id={`${uid}-i`} label="Fecha y hora" ayuda="Hora de Chile." error={errores.inicia}>
              <Input id={`${uid}-i`} type="datetime-local" value={f.inicia} conAyuda invalido={!!errores.inicia} onChange={set("inicia")} />
            </Field>
            <Field id={`${uid}-d`} label="Duración (minutos)" error={errores.duracionMin}>
              <Input id={`${uid}-d`} type="number" inputMode="numeric" min={5} max={600} value={f.duracion} invalido={!!errores.duracionMin} onChange={set("duracion")} />
            </Field>
          </div>
          <Field id={`${uid}-m`} label="Enlace de Google Meet" opcional ayuda="Crea la reunión en Google Meet o Calendar y pega aquí el enlace." error={errores.enlaceMeet}>
            <Input id={`${uid}-m`} type="url" inputMode="url" placeholder="https://meet.google.com/…" value={f.meet} conAyuda invalido={!!errores.enlaceMeet} onChange={set("meet")} />
          </Field>
          <Field id={`${uid}-ds`} label="Descripción" opcional error={errores.descripcion}>
            <Textarea id={`${uid}-ds`} className="tr-textarea" rows={3} value={f.descripcion} invalido={!!errores.descripcion} onChange={set("descripcion")} />
          </Field>
          <h3 className="tr-sum">Después de la clase</h3>
          <Field id={`${uid}-g`} label="Enlace de la grabación" opcional error={errores.grabacionUrl}>
            <Input id={`${uid}-g`} type="url" inputMode="url" placeholder="https://drive.google.com/…" value={f.grabacion} invalido={!!errores.grabacionUrl} onChange={set("grabacion")} />
          </Field>
          <Field id={`${uid}-r`} label="Resumen: qué se vio" opcional ayuda="Acepta el mismo formato que las lecciones, incluidas fórmulas con $...$." error={errores.resumen}>
            <Textarea id={`${uid}-r`} className="tr-textarea" rows={10} value={f.resumen} conAyuda invalido={!!errores.resumen} onChange={set("resumen")} />
          </Field>
          <div className="tr-actions">
            <Button onClick={guardar} disabled={trabajando}>
              {trabajando ? "Guardando…" : "Guardar clase"}
            </Button>
            <Button variante="secondary" onClick={() => setEditando(null)} disabled={trabajando}>
              Cancelar
            </Button>
          </div>
        </section>
      )}

      <p className={`tr-status${msg?.error ? " tr-status--error" : ""}`} role={msg?.error ? "alert" : "status"}>
        {msg?.texto}
      </p>

      <section className="ci-stack" style={{ gap: "var(--av-space-3)" }} aria-labelledby={`${uid}-p`}>
        <h2 className="ci-card__title" id={`${uid}-p`}>
          Próximas
        </h2>
        {proximas.length === 0 ? <p className="ci-muted">No tienes clases agendadas.</p> : <ul className="ci-list">{proximas.map((c) => fila(c, false))}</ul>}
      </section>
      {pasadas.length > 0 && (
        <section className="ci-stack" style={{ gap: "var(--av-space-3)" }} aria-labelledby={`${uid}-pa`}>
          <h2 className="ci-card__title" id={`${uid}-pa`}>
            Ya realizadas
          </h2>
          <ul className="ci-list">{pasadas.map((c) => fila(c, true))}</ul>
        </section>
      )}

      <ConfirmDialog abierto={!!quitar} titulo="¿Quitar esta clase?" confirmar="Quitar clase" peligro onConfirmar={borrar} onCancelar={() => setQuitar(null)}>
        <p>Los alumnos dejarán de verla, con su grabación y resumen.</p>
      </ConfirmDialog>
    </div>
  );
}
