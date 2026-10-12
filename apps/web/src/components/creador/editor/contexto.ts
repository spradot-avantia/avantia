import type { Dispatch, SetStateAction } from "react";
import type { CampoCurso, CursoCompleto, PasoEditor } from "../../../lib/creador/types";
import type { Autosave } from "./useAutosave";

/** Lo que el editor comparte con cada paso. */
export interface EditorCtx {
  curso: CursoCompleto;
  setCurso: Dispatch<SetStateAction<CursoCompleto>>;
  auto: Autosave;
  /** Errores de validacion por campo (locales o devueltos por el servidor). */
  erroresCampo: Record<string, string>;
  /** Valida y programa el guardado de un campo del curso. */
  guardarCampo: (campo: CampoCurso, valor: unknown) => void;
  tocado: Record<string, boolean>;
  marcarTocado: (campo: string) => void;
  /** Anuncio para lectores de pantalla (aria-live="polite"). */
  anunciar: (mensaje: string) => void;
  /** Aviso de error visible (aria-live="assertive"); null lo limpia. */
  avisar: (mensaje: string | null) => void;
  irAPaso: (paso: PasoEditor) => void;
  /** Relee el curso desde la base tras un guardado fallido. */
  resincronizar: () => Promise<void>;
  /** Espera los guardados pendientes y navega (p. ej. a la vista previa). */
  salir: (href: string) => Promise<void>;
  urlPublica: string;
}
