"use client";

// Paso 3: LISTA DE MÓDULOS (ADR 029). Cada módulo se abre en su propia pantalla
// (/cursos/[cursoId]/modulos/[moduloId]), donde se edita en profundidad.
// Aquí solo se ve el panorama: orden, estado, duración, y agregar o eliminar módulos.
import { useEffect, useState } from "react";
import { crearModuloAction, eliminarModuloAction, moverModuloAction } from "../../../lib/creador/actions";
import { aplicarEstructuraSugeridaAction } from "../../../lib/creador/actionsEditor";
import { estadoQuiz } from "../../../lib/creador/quiz";
import { leccionLista } from "../../../lib/creador/reglasPublicacion";
import type { Modulo } from "../../../lib/creador/types";
import { Badge } from "../Badge";
import { Button } from "../Button";
import { Acciones } from "./AccionesFila";
import { ConfirmDialog } from "./ConfirmDialog";
import type { EditorCtx } from "./contexto";
import "./modulo.css";

/** Texto «3 lecciones · 25 min» de un módulo. */
export function resumenModulo(m: Modulo): string {
  const partes = [`${m.lecciones.length} ${m.lecciones.length === 1 ? "lección" : "lecciones"}`];
  if (m.duracionMin) partes.push(`${m.duracionMin} min`);
  return partes.join(" · ");
}

/** Estado de contenido de un módulo: sin lecciones, con lecciones incompletas o listo. */
export function estadoModulo(m: Modulo): "vacio" | "falta" | "listo" {
  if (m.lecciones.length === 0) return "vacio";
  return m.lecciones.every(leccionLista) ? "listo" : "falta";
}

export function PasoEstructura({ ctx }: { ctx: EditorCtx }) {
  const { curso, setCurso, auto } = ctx;
  const [pendiente, setPendiente] = useState<Modulo | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const [foco, setFoco] = useState<string | null>(null);

  useEffect(() => {
    if (!foco) return;
    document.getElementById(foco)?.focus();
    setFoco(null);
  }, [foco, curso.modulos]);

  const abrir = (m: Modulo) => void ctx.salir(`/cursos/${curso.id}/modulos/${m.id}`);

  const agregarModulo = async () => {
    setTrabajando(true);
    const titulo = `Módulo ${curso.modulos.length + 1}`;
    const r = await auto.encolar(null, () => crearModuloAction(curso.id, titulo));
    setTrabajando(false);
    if (!r.ok) return ctx.avisar(r.error);
    const id = r.data.id;
    setCurso((c) => ({
      ...c,
      modulos: [
        ...c.modulos,
        { id, cursoId: c.id, titulo, orden: c.modulos.length, descripcion: null, objetivos: [], duracionMin: null, lecciones: [] },
      ],
    }));
    ctx.anunciar(`${titulo} agregado`);
    setFoco(`ed-abrir-${id}`);
  };

  const usarSugerida = async () => {
    setTrabajando(true);
    const r = await auto.encolar(null, () => aplicarEstructuraSugeridaAction(curso.id));
    setTrabajando(false);
    if (!r.ok) return ctx.avisar(r.error);
    setCurso((c) => ({ ...c, modulos: r.data.modulos }));
    ctx.anunciar("Estructura sugerida agregada: 3 módulos");
  };

  const moverModulo = async (m: Modulo, dir: "subir" | "bajar") => {
    const i = curso.modulos.findIndex((x) => x.id === m.id);
    const j = dir === "subir" ? i - 1 : i + 1;
    if (j < 0 || j >= curso.modulos.length) return;
    setCurso((c) => {
      const mods = [...c.modulos];
      [mods[i], mods[j]] = [mods[j], mods[i]];
      return { ...c, modulos: mods };
    });
    ctx.anunciar(`${m.titulo || "Módulo"} movido a la posición ${j + 1} de ${curso.modulos.length}`);
    const r = await auto.encolar(null, () => moverModuloAction(m.id, dir));
    if (!r.ok) {
      ctx.avisar(r.error);
      await ctx.resincronizar();
    }
  };

  const eliminarModulo = async (m: Modulo) => {
    setPendiente(null);
    setTrabajando(true);
    const r = await auto.encolar(null, () => eliminarModuloAction(m.id));
    setTrabajando(false);
    if (!r.ok) return ctx.avisar(r.error);
    auto.cancelar(`mod:${m.id}`);
    m.lecciones.forEach((l) => auto.cancelar(`lec:${l.id}:`));
    setCurso((c) => ({ ...c, modulos: c.modulos.filter((x) => x.id !== m.id) }));
    ctx.anunciar(`Módulo ${m.titulo} eliminado`);
    setFoco("ed-add-modulo");
  };

  const vacio = curso.modulos.length === 0;

  return (
    <div className="ed-form">
      <p className="ed-lede">
        Organiza el curso en módulos. Abre cada módulo para describirlo, escribir qué se aprenderá y editar sus lecciones y su quiz.
      </p>

      {vacio && (
        <div className="ed-sugerida">
          <h3 className="ed-sugerida__t">¿Cómo quieres empezar?</h3>
          <p className="ed-sugerida__d">
            La estructura sugerida crea 3 módulos vacíos: <strong>Contexto</strong>, <strong>Casos reales</strong> y <strong>Aplicación</strong>.
            Puedes renombrarlos, moverlos o eliminarlos.
          </p>
          <div className="ed-sugerida__acc">
            <Button onClick={usarSugerida} disabled={trabajando}>
              Usar estructura sugerida
            </Button>
            <Button variante="secondary" onClick={agregarModulo} disabled={trabajando}>
              Empezar desde cero
            </Button>
          </div>
        </div>
      )}

      {!vacio && (
        <ol className="md-lista">
          {curso.modulos.map((m, i) => {
            const estado = estadoModulo(m);
            const q = estadoQuiz(m.quiz);
            return (
              <li key={m.id} className="md-card">
                <div className="md-card__main">
                  <h3 className="md-card__titulo">
                    <span className="md-card__n" aria-hidden="true">
                      {i + 1}
                    </span>
                    <span>{m.titulo.trim() || "Módulo sin nombre"}</span>
                  </h3>
                  <p className="md-card__meta">{resumenModulo(m)}</p>
                  <div className="md-card__chips">
                    <Badge tono={estado === "listo" ? "ok" : "warning"}>
                      {estado === "listo" ? "Listo" : estado === "vacio" ? "Sin lecciones" : "Falta contenido"}
                    </Badge>
                    <Badge tono="neutral">{q.total ? `Quiz · ${q.total} ${q.total === 1 ? "pregunta" : "preguntas"}` : "Sin quiz"}</Badge>
                    {m.descripcion && <Badge tono="neutral">Con presentación</Badge>}
                  </div>
                </div>
                <div className="md-card__acc">
                  <Button id={`ed-abrir-${m.id}`} onClick={() => abrir(m)}>
                    Abrir
                    <span className="av-sr-only"> {m.titulo || `módulo ${i + 1}`}</span>
                  </Button>
                  <Acciones
                    nombre={`módulo ${m.titulo || i + 1}`}
                    primero={i === 0}
                    ultimo={i === curso.modulos.length - 1}
                    onSubir={() => moverModulo(m, "subir")}
                    onBajar={() => moverModulo(m, "bajar")}
                    onEliminar={() => setPendiente(m)}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {!vacio && (
        <div>
          <Button id="ed-add-modulo" variante="secondary" onClick={agregarModulo} disabled={trabajando}>
            + Agregar módulo
          </Button>
        </div>
      )}

      <ConfirmDialog
        abierto={!!pendiente}
        peligro
        titulo={pendiente ? `¿Eliminar el módulo “${pendiente.titulo}”?` : ""}
        confirmar="Eliminar"
        onCancelar={() => setPendiente(null)}
        onConfirmar={() => pendiente && void eliminarModulo(pendiente)}
      >
        {pendiente && (
          <p>
            {pendiente.lecciones.length > 0 ? `Se eliminarán también sus ${pendiente.lecciones.length} lecciones. ` : ""}
            Esta acción no se puede deshacer.
          </p>
        )}
      </ConfirmDialog>
    </div>
  );
}
