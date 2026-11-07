"use client";

import { useEffect, useState } from "react";
import { IconoRayo } from "../ui/Iconos";
import "./alumno.css";

/** Aviso breve de XP ganada: desaparece solo y no parece un botón. */
export function ToastXp({ xp }: { xp: number }) {
  const [visible, setVisible] = useState(true);
  // La región "status" existe vacía y el texto entra después: así los lectores de pantalla lo anuncian.
  const [anunciado, setAnunciado] = useState(false);
  useEffect(() => {
    const a = setTimeout(() => setAnunciado(true), 300);
    const t = setTimeout(() => setVisible(false), 4500);
    return () => {
      clearTimeout(a);
      clearTimeout(t);
    };
  }, []);
  if (!visible) return null;
  return (
    <div role="status">
      {anunciado && (
        <p className="al-xp">
          <IconoRayo tam={16} /> +{xp} XP ganados
        </p>
      )}
    </div>
  );
}
