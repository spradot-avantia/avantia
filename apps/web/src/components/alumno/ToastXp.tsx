"use client";

import { useEffect, useState } from "react";
import "./alumno.css";

/** Aviso breve de XP ganada: desaparece solo y no parece un botón. */
export function ToastXp({ xp }: { xp: number }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 4500);
    return () => clearTimeout(t);
  }, []);
  if (!visible) return null;
  return (
    <p className="al-xp" role="status">
      <span aria-hidden="true">⭐</span> +{xp} XP ganados
    </p>
  );
}
