"use client";

import type { ButtonHTMLAttributes } from "react";

/** Botón de envío que pide confirmación antes de una acción difícil de deshacer. */
export function BotonConfirmar({
  mensaje,
  onClick,
  ...props
}: { mensaje: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="submit"
      {...props}
      onClick={(e) => {
        if (!window.confirm(mensaje)) e.preventDefault();
        onClick?.(e);
      }}
    />
  );
}
