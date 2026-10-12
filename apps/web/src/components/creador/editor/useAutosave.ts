"use client";

// Autoguardado del editor: cada cambio se programa con una clave (debounce
// ~800 ms por clave) y TODAS las llamadas al servidor se serializan en una
// sola cola, asi nunca se pisan (p. ej. crear una leccion y renombrarla).
import { useCallback, useEffect, useRef, useState } from "react";
import type { Resultado } from "../../../lib/creador/types";

export const DEBOUNCE_MS = 800;
const ERROR_RED = "No pudimos conectarnos. Revisa tu conexión e inténtalo de nuevo.";

export type EstadoGuardado = "inactivo" | "guardando" | "guardado" | "error";
type Tarea = () => Promise<Resultado<unknown>>;

export function useAutosave() {
  const timers = useRef(new Map<string, { id: ReturnType<typeof setTimeout>; fn: Tarea }>());
  const fallidas = useRef(new Map<string, Tarea>());
  const cola = useRef<Promise<unknown>>(Promise.resolve());
  const enVuelo = useRef(0);
  const huboGuardado = useRef(false);
  const ultimoError = useRef<string | null>(null);
  const [vista, setVista] = useState<{ estado: EstadoGuardado; error: string | null }>({ estado: "inactivo", error: null });

  const actualizar = useCallback(() => {
    const ocupado = enVuelo.current > 0 || timers.current.size > 0;
    const estado: EstadoGuardado = ocupado
      ? "guardando"
      : fallidas.current.size > 0
        ? "error"
        : huboGuardado.current
          ? "guardado"
          : "inactivo";
    const error = estado === "error" ? ultimoError.current : null;
    setVista((prev) => (prev.estado === estado && prev.error === error ? prev : { estado, error }));
  }, []);

  /** Pone una llamada en la cola serializada. `clave` (opcional) la hace reintentable. */
  const encolar = useCallback(
    <T,>(clave: string | null, fn: () => Promise<Resultado<T>>): Promise<Resultado<T>> => {
      enVuelo.current++;
      actualizar();
      const p = cola.current
        .then(async (): Promise<Resultado<T>> => {
          try {
            return await fn();
          } catch {
            return { ok: false, error: ERROR_RED };
          }
        })
        .then((r) => {
          enVuelo.current--;
          if (r.ok) {
            huboGuardado.current = true;
            if (clave) fallidas.current.delete(clave);
          } else if (clave) {
            fallidas.current.set(clave, fn);
            ultimoError.current = r.error;
          }
          actualizar();
          return r;
        });
      cola.current = p;
      return p;
    },
    [actualizar],
  );

  /** Programa (o reprograma) un guardado con debounce bajo `clave`. */
  const programar = useCallback(
    (clave: string, fn: Tarea, ms = DEBOUNCE_MS) => {
      const previo = timers.current.get(clave);
      if (previo) clearTimeout(previo.id);
      fallidas.current.delete(clave);
      const id = setTimeout(() => {
        timers.current.delete(clave);
        void encolar(clave, fn);
      }, ms);
      timers.current.set(clave, { id, fn });
      actualizar();
    },
    [actualizar, encolar],
  );

  /** Descarta guardados pendientes/fallidos cuyas claves empiezan con `prefijo`. */
  const cancelar = useCallback(
    (prefijo: string) => {
      for (const [k, t] of Array.from(timers.current)) {
        if (k.startsWith(prefijo)) {
          clearTimeout(t.id);
          timers.current.delete(k);
        }
      }
      for (const k of Array.from(fallidas.current.keys())) if (k.startsWith(prefijo)) fallidas.current.delete(k);
      actualizar();
    },
    [actualizar],
  );

  /** Ejecuta ya todo lo pendiente y espera a que la cola termine. */
  const flush = useCallback(async () => {
    for (const [k, t] of Array.from(timers.current)) {
      clearTimeout(t.id);
      timers.current.delete(k);
      void encolar(k, t.fn);
    }
    await cola.current;
  }, [encolar]);

  const reintentar = useCallback(() => {
    const todas = Array.from(fallidas.current);
    fallidas.current.clear();
    for (const [k, fn] of todas) void encolar(k, fn);
  }, [encolar]);

  // Al desmontar (navegar a otra seccion) no se pierde lo pendiente.
  useEffect(() => {
    const t = timers.current;
    return () => {
      for (const [k, x] of Array.from(t)) {
        clearTimeout(x.id);
        t.delete(k);
        void encolar(k, x.fn);
      }
    };
  }, [encolar]);

  const sinGuardar = vista.estado === "guardando" || vista.estado === "error";
  useEffect(() => {
    if (!sinGuardar) return;
    const aviso = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, [sinGuardar]);

  return { estado: vista.estado, error: vista.error, programar, encolar, cancelar, flush, reintentar };
}

export type Autosave = ReturnType<typeof useAutosave>;
