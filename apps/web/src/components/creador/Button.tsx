import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import "./creador.css";

type Variante = "primary" | "secondary" | "ghost" | "danger";

function clases(variante: Variante, bloque?: boolean, extra?: string) {
  const v = variante === "primary" || variante === "secondary" ? `av-btn--${variante}` : `cr-btn--${variante}`;
  return ["av-btn", "cr-btn", v, bloque ? "cr-btn--block" : "", extra ?? ""].filter(Boolean).join(" ");
}

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  bloque?: boolean;
}

/** Boton >= 44px. Por defecto type="button". */
export function Button({ variante = "primary", bloque, className, type = "button", ...rest }: BtnProps) {
  return <button type={type} className={clases(variante, bloque, className)} {...rest} />;
}

interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string;
  variante?: Variante;
  bloque?: boolean;
  children: ReactNode;
}

/** Enlace con apariencia de boton (>= 44px). */
export function LinkButton({ href, variante = "primary", bloque, className, ...rest }: LinkProps) {
  return <Link href={href} className={clases(variante, bloque, className)} {...rest} />;
}
