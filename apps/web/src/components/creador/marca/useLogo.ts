"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { quitarLogoAction, subirLogoAction } from "../../../lib/creador/actions";
import type { Resultado, TenantCreador } from "../../../lib/creador/types";

/** Estado local del logo: lo elegido se sube al GUARDAR, no al elegirlo. */
export interface LogoLocal {
  /** URL para mostrar: blob (nuevo), url remota (actual) o null (sin logo). */
  url: string | null;
  /** Archivo nuevo pendiente de subir. */
  file: File | null;
  nombre: string;
  info: string;
  /** Relacion ancho/alto (para sugerir "solo logo"). */
  ratio: number;
  /** El creador quito el logo que ya tenia. */
  quitado: boolean;
}

function inicial(url: string | null): LogoLocal {
  return { url, file: null, nombre: url ? "Logo actual" : "", info: "", ratio: 1, quitado: false };
}

export function useLogo(urlInicial: string | null) {
  const [logo, setLogo] = useState<LogoLocal>(() => inicial(urlInicial));
  const blob = useRef<string | null>(null);

  const liberar = useCallback(() => {
    if (blob.current) URL.revokeObjectURL(blob.current);
    blob.current = null;
  }, []);
  useEffect(() => liberar, [liberar]);

  const seleccionar = useCallback(
    (file: File, url: string, info: string, ratio: number) => {
      liberar();
      blob.current = url;
      setLogo({ url, file, nombre: file.name, info, ratio, quitado: false });
    },
    [liberar],
  );
  const quitar = useCallback(() => {
    liberar();
    setLogo({ url: null, file: null, nombre: "", info: "", ratio: 1, quitado: true });
  }, [liberar]);
  const reiniciar = useCallback(
    (url: string | null) => {
      liberar();
      setLogo(inicial(url));
    },
    [liberar],
  );

  return { logo, seleccionar, quitar, reiniciar };
}

/** Aplica en el servidor el logo pendiente (subir o quitar). null = nada que hacer. */
export async function aplicarLogo(logo: LogoLocal): Promise<Resultado<TenantCreador> | null> {
  if (logo.file) {
    const fd = new FormData();
    fd.set("logo", logo.file);
    return subirLogoAction(fd);
  }
  if (logo.quitado) return quitarLogoAction();
  return null;
}
