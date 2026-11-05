"use client";

// Materiales (enlaces o documentos https) de un módulo o de una lección (ADR 029, F2).
// Con `leccionId` null edita los del módulo; con un id, los de esa lección. El tope de 10
// cuenta todos los materiales del módulo. Autoguardado con la cola del editor.
import { useEffect, useState } from "react";
import {
  actualizarMaterialAction,
  crearMaterialAction,
  eliminarMaterialAction,
  moverMaterialAction,
} from "../../../lib/creador/actionsEditor";
import type { Material, Modulo, TipoMaterial } from "../../../lib/creador/types";
import {
  MATERIALES_MODULO_MAX,
  NOTA_MATERIAL_MAX,
  notaMaterial,
  tituloMaterial,
  validarUrlMaterial,
} from "../../../lib/creador/validacion";
import { Button } from "../Button";
import { Field, Input, Select } from "../Field";
import { Acciones } from "./AccionesFila";
import { ConfirmDialog } from "./ConfirmDialog";
import type { EditorCtx } from "./contexto";
import "./materiales.css";

const TIPOS: ReadonlyArray<{ id: TipoMaterial; label: string }> = [
  { id: "enlace", label: "Enlace" },
  { id: "documento", label: "Documento" },
];

export function EditorMateriales({
  ctx,
  modulo,
  leccionId = null,
  nombreGrupo,
}: {
  ctx: EditorCtx;
  modulo: Modulo;
  leccionId?: string | null;
  /** Para los textos visibles, p. ej. «este módulo» o «esta lección». */
  nombreGrupo: string;
}) {
  const { setCurso, auto } = ctx;
  const [foco, setFoco] = useState<string | null>(null);
  const [pendiente, setPendiente] = useState<Material | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const [tocUrl, setTocUrl] = useState<Record<string, boolean>>({});

  const lista = modulo.materiales.filter((m) => m.leccionId === leccionId);
  const sufijo = leccionId ?? "mod";
  const llegoAlTope = modulo.materiales.length >= MATERIALES_MODULO_MAX;

  useEffect(() => {
    if (!foco) return;
    document.getElementById(foco)?.focus();
    setFoco(null);
  }, [foco, modulo.materiales]);

  const mapMats = (fn: (ms: Material[]) => Material[]) =>
    setCurso((c) => ({ ...c, modulos: c.modulos.map((m) => (m.id === modulo.id ? { ...m, materiales: fn(m.materiales) } : m)) }));
  const mapMat = (id: string, fn: (m: Material) => Material) => mapMats((ms) => ms.map((m) => (m.id === id ? fn(m) : m)));

  const agregar = async () => {
    setTrabajando(true);
    const r = await auto.encolar(null, () => crearMaterialAction(modulo.id, { leccionId }));
    setTrabajando(false);
    if (!r.ok) return ctx.avisar(r.error);
    mapMats((ms) => [...ms, r.data]);
    ctx.anunciar("Material agregado");
    setFoco(`mat-titulo-${r.data.id}`);
  };

  const cambiarTitulo = (m: Material, valor: string) => {
    mapMat(m.id, (x) => ({ ...x, titulo: valor }));
    if (!tituloMaterial.safeParse(valor).success) return auto.cancelar(`mat:${m.id}:titulo`);
    auto.programar(`mat:${m.id}:titulo`, () => actualizarMaterialAction(m.id, { titulo: valor }));
  };

  const cambiarUrl = (m: Material, valor: string) => {
    mapMat(m.id, (x) => ({ ...x, url: valor }));
    if (!valor.trim()) return auto.programar(`mat:${m.id}:url`, () => actualizarMaterialAction(m.id, { url: null }));
    if (!validarUrlMaterial(valor).ok) return auto.cancelar(`mat:${m.id}:url`);
    auto.programar(`mat:${m.id}:url`, () => actualizarMaterialAction(m.id, { url: valor }));
  };

  const cambiarNota = (m: Material, valor: string) => {
    mapMat(m.id, (x) => ({ ...x, nota: valor }));
    if (!notaMaterial.safeParse(valor).success) return auto.cancelar(`mat:${m.id}:nota`);
    auto.programar(`mat:${m.id}:nota`, () => actualizarMaterialAction(m.id, { nota: valor }));
  };

  const cambiarTipo = (m: Material, tipo: TipoMaterial) => {
    mapMat(m.id, (x) => ({ ...x, tipo }));
    void auto.encolar(`mat:${m.id}:tipo`, () => actualizarMaterialAction(m.id, { tipo }));
  };

  const mover = async (m: Material, dir: "subir" | "bajar") => {
    const i = lista.findIndex((x) => x.id === m.id);
    const j = dir === "subir" ? i - 1 : i + 1;
    if (j < 0 || j >= lista.length) return;
    // Se intercambian las posiciones de los dos vecinos dentro del arreglo del módulo.
    mapMats((ms) => {
      const a = ms.findIndex((x) => x.id === lista[i].id);
      const b = ms.findIndex((x) => x.id === lista[j].id);
      const copia = [...ms];
      [copia[a], copia[b]] = [copia[b], copia[a]];
      return copia;
    });
    ctx.anunciar(`${m.titulo || "Material"} movido a la posición ${j + 1} de ${lista.length}`);
    const r = await auto.encolar(null, () => moverMaterialAction(m.id, dir));
    if (!r.ok) {
      ctx.avisar(r.error);
      await ctx.resincronizar();
    }
  };

  const eliminar = async (m: Material) => {
    setPendiente(null);
    setTrabajando(true);
    const r = await auto.encolar(null, () => eliminarMaterialAction(m.id));
    setTrabajando(false);
    if (!r.ok) return ctx.avisar(r.error);
    auto.cancelar(`mat:${m.id}:`);
    mapMats((ms) => ms.filter((x) => x.id !== m.id));
    ctx.anunciar(`Material ${m.titulo} eliminado`);
    setFoco(`mat-add-${sufijo}`);
  };

  return (
    <div className="mt">
      {lista.length === 0 ? (
        <p className="ed-vacio">
          Aún no hay materiales en {nombreGrupo}. Agrega guías, planillas, artículos o cualquier enlace que ayude a tus estudiantes.
        </p>
      ) : (
        <ul className="mt-lista">
          {lista.map((m, i) => {
            const eTitulo = tituloMaterial.safeParse(m.titulo);
            const vUrl = m.url?.trim() ? validarUrlMaterial(m.url) : null;
            const eUrl = tocUrl[m.id] && vUrl && !vUrl.ok ? vUrl.error : undefined;
            const nt = notaMaterial.safeParse(m.nota ?? "");
            const eNota = nt.success ? undefined : nt.error.issues[0].message;
            const completo = !!vUrl?.ok;
            return (
              <li key={m.id} className="mt-item">
                <div className="mt-item__cab">
                  <span className="mt-item__num">
                    Material {i + 1}
                    {!completo && <span className="mt-item__falta"> · Falta el enlace</span>}
                  </span>
                  <Acciones
                    nombre={`material ${m.titulo || i + 1}`}
                    primero={i === 0}
                    ultimo={i === lista.length - 1}
                    onSubir={() => mover(m, "subir")}
                    onBajar={() => mover(m, "bajar")}
                    onEliminar={() => setPendiente(m)}
                  />
                </div>
                <div className="mt-item__campos">
                  <Field
                    id={`mat-titulo-${m.id}`}
                    label="Título"
                    error={eTitulo.success ? undefined : eTitulo.error.issues[0].message}
                  >
                    <Input
                      id={`mat-titulo-${m.id}`}
                      value={m.titulo}
                      autoComplete="off"
                      invalido={!eTitulo.success}
                      onChange={(e) => cambiarTitulo(m, e.target.value)}
                    />
                  </Field>
                  <Field id={`mat-tipo-${m.id}`} label="Tipo">
                    <Select id={`mat-tipo-${m.id}`} value={m.tipo} onChange={(e) => cambiarTipo(m, e.target.value as TipoMaterial)}>
                      {TIPOS.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <Field
                  id={`mat-url-${m.id}`}
                  label="Enlace"
                  ayuda="Pega un enlace https: Google Drive, Dropbox, Notion, un artículo… Revisa que tus estudiantes puedan abrirlo."
                  error={eUrl}
                >
                  <Input
                    id={`mat-url-${m.id}`}
                    type="url"
                    inputMode="url"
                    value={m.url ?? ""}
                    placeholder="https://"
                    autoComplete="off"
                    conAyuda
                    invalido={!!eUrl}
                    onChange={(e) => cambiarUrl(m, e.target.value)}
                    onBlur={() => setTocUrl((t) => ({ ...t, [m.id]: true }))}
                  />
                </Field>
                <Field
                  id={`mat-nota-${m.id}`}
                  label="Nota"
                  opcional
                  ayuda="Una línea que diga para qué sirve o qué parte leer."
                  contador={`${(m.nota ?? "").length}/${NOTA_MATERIAL_MAX}`}
                  error={eNota}
                >
                  <Input
                    id={`mat-nota-${m.id}`}
                    value={m.nota ?? ""}
                    autoComplete="off"
                    maxLength={NOTA_MATERIAL_MAX}
                    conAyuda
                    invalido={!!eNota}
                    onChange={(e) => cambiarNota(m, e.target.value)}
                  />
                </Field>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-pie">
        <Button id={`mat-add-${sufijo}`} variante="secondary" onClick={agregar} disabled={trabajando || llegoAlTope}>
          + Agregar material
        </Button>
        {llegoAlTope && (
          <span className="ed-vacio" role="status">
            Llegaste al máximo de {MATERIALES_MODULO_MAX} materiales por módulo.
          </span>
        )}
      </div>

      <ConfirmDialog
        abierto={!!pendiente}
        peligro
        titulo={pendiente ? `¿Eliminar el material “${pendiente.titulo}”?` : ""}
        confirmar="Eliminar"
        onCancelar={() => setPendiente(null)}
        onConfirmar={() => pendiente && void eliminar(pendiente)}
      >
        <p>Se quitará el material de este módulo. Esta acción no se puede deshacer.</p>
      </ConfirmDialog>
    </div>
  );
}
