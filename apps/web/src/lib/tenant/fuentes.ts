// Fuentes de la identidad por academia (ADR 027). Se declaran con next/font, pero el
// navegador solo descarga un archivo cuando una academia usa esa tipografía
// (preload desactivado). Importar SOLO desde el sitio del tenant, el sitio del
// alumno y las vistas previas del panel: nunca desde la landing.
import { Fraunces, Nunito, Plus_Jakarta_Sans } from "next/font/google";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-tn-fraunces", display: "swap", preload: false });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-tn-nunito", display: "swap", preload: false });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-tn-jakarta", display: "swap", preload: false });

/** Clases que declaran las variables --font-tn-*; van en el contenedor raíz de la academia. */
export const clasesFuentes = `${fraunces.variable} ${nunito.variable} ${jakarta.variable}`;
