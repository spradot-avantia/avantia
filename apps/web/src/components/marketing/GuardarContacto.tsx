"use client";

// Botón «Guardar contacto». En iPhone basta con abrir el .vcf (Safari muestra la
// ficha con «Crear contacto nuevo»). En Android, Chrome lo descargaría; por eso ahí
// se intenta abrir directo el formulario de nuevo contacto con un intent de Android
// (developer.chrome.com/docs/android/intents). Si el teléfono no lo acepta, Chrome
// sigue a S.browser_fallback_url: el mismo .vcf de siempre.

import { useEffect, useState, type ReactNode } from "react";

export interface DatosContacto {
  nombre: string;
  telefono: string | null; // con +código de país
  correo: string;
  empresa: string;
  cargo: string | null;
}

function intentAndroid(d: DatosContacto, vcfAbsoluto: string): string {
  const e = encodeURIComponent;
  const extras = [
    `S.name=${e(d.nombre)}`,
    d.telefono ? `S.phone=${e(d.telefono)}` : null,
    `S.email=${e(d.correo)}`,
    `S.company=${e(d.empresa)}`,
    d.cargo ? `S.job_title=${e(d.cargo)}` : null,
    `S.browser_fallback_url=${e(vcfAbsoluto)}`,
  ].filter(Boolean);
  return `intent:#Intent;action=android.intent.action.INSERT;type=vnd.android.cursor.dir/raw_contact;${extras.join(";")};end`;
}

export function GuardarContacto({
  vcfHref,
  datos,
  className,
  children,
}: {
  vcfHref: string;
  datos: DatosContacto;
  className?: string;
  children: ReactNode;
}) {
  const [href, setHref] = useState(vcfHref);

  useEffect(() => {
    if (/android/i.test(navigator.userAgent)) {
      setHref(intentAndroid(datos, new URL(vcfHref, window.location.origin).toString()));
    }
  }, [vcfHref, datos]);

  return (
    <a className={className} href={href}>
      {children}
    </a>
  );
}
