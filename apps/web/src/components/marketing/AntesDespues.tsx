"use client";

// Comparativa "Hoy" / "Con Avantia" de la landing. Las tarjetas van una sobre
// otra y aparecen una vez al entrar en pantalla (sin fijar el scroll). Cada
// "pieza suelta" explica su problema con una burbuja que se abre con un toque,
// el teclado o el mouse; el nombre de cada pieza queda siempre a la vista.
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Icon, type IconName } from "./icons";
import { useAparecer } from "./useAparecer";

const PIEZAS: { icon: IconName; nombre: string; texto: string; top: number; giro: string; lado: "izq" | "der" }[] = [
  { icon: "folder", nombre: "Archivos", texto: "Tus materiales repartidos en carpetas, drives y sitios distintos.", top: 4, giro: "-8deg", lado: "izq" },
  { icon: "chat", nombre: "Mensajes", texto: "Avisos y dudas sueltos entre WhatsApp, correo y redes.", top: 50, giro: "6deg", lado: "izq" },
  { icon: "bank", nombre: "Pagos", texto: "Cobros por transferencia, sin un sistema de pagos ni de finanzas.", top: 0, giro: "-4deg", lado: "izq" },
  { icon: "table", nombre: "Planillas", texto: "Alumnos, accesos y cuentas llevados a mano en planillas.", top: 44, giro: "9deg", lado: "der" },
  { icon: "tag", nombre: "Otra marca", texto: "Tus alumnos ven el logo de otra plataforma, no el tuyo.", top: 2, giro: "-6deg", lado: "der" },
];

const DESPUES = ["Tus contenidos organizados en tu propia academia", "Tus alumnos se inscriben y pagan ahí mismo", "Tu logo, tus colores y tu dominio en cada paso"];
const HERRAMIENTAS: IconName[] = ["folder", "card", "users", "bot", "video"];

function Lista({ items, icon, color }: { items: string[]; icon: IconName; color: string }) {
  return (
    <ul>
      {items.map((t) => (
        <li key={t}>
          <Icon name={icon} color={color} />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

export function AntesDespues() {
  const antes = useAparecer();
  const despues = useAparecer();
  const [abierta, setAbierta] = useState<IconName | null>(null);
  const zona = useRef<HTMLDivElement>(null);

  // Cierra la burbuja con Escape o tocando fuera.
  useEffect(() => {
    if (!abierta) return;
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && setAbierta(null);
    const fuera = (e: PointerEvent) => {
      if (!zona.current?.contains(e.target as Node)) setAbierta(null);
    };
    document.addEventListener("keydown", tecla);
    document.addEventListener("pointerdown", fuera);
    return () => {
      document.removeEventListener("keydown", tecla);
      document.removeEventListener("pointerdown", fuera);
    };
  }, [abierta]);

  return (
    <div className="lp-compare">
      <div ref={antes.ref} className={`lp-cmp lp-cmp--before${antes.clase}`}>
        <div className="lp-cmp__cab">
          <span className="av-overline" style={{ color: "var(--av-muted)" }}>Hoy</span>
          <span className="lp-cmp__pista">Toca cada pieza para ver qué problema trae</span>
        </div>
        <div className="lp-scatter" ref={zona}>
          {PIEZAS.map((p, i) => {
            const abiertaAhora = abierta === p.icon;
            return (
              <div
                key={p.icon}
                className={`lp-pieza${abiertaAhora ? " is-open" : ""}`}
                // Repartidas de borde a borde: --pz es el tamaño de la pieza (CSS).
                style={{ top: p.top, left: `calc(${i} * (100% - var(--pz)) / ${PIEZAS.length - 1})` }}
                // Con mouse: pasar sobre otra pieza cierra la que quedó abierta con clic.
                onPointerEnter={(e) => {
                  if (e.pointerType === "mouse" && abierta && abierta !== p.icon) setAbierta(null);
                }}
              >
                <button
                  type="button"
                  aria-label={p.nombre}
                  aria-expanded={abiertaAhora}
                  aria-describedby={`lp-burbuja-${p.icon}`}
                  style={{ rotate: p.giro }}
                  onClick={() => setAbierta(abiertaAhora ? null : p.icon)}
                >
                  <Icon name={p.icon} size={26} />
                </button>
                <span className="lp-pieza__t" aria-hidden="true">{p.nombre}</span>
                <span id={`lp-burbuja-${p.icon}`} className={`lp-burbuja lp-burbuja--${p.lado}`}>
                  <b>{p.nombre}</b> {p.texto}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="lp-arrow" aria-hidden="true">
        <Icon name="arrow" size={26} />
      </div>

      <div ref={despues.ref} className={`lp-cmp lp-cmp--after${despues.clase}`}>
        <div className="lp-cmp__cab">
          <span className="av-overline">Con Avantia</span>
        </div>
        <div className="lp-unified" aria-hidden="true">
          <div className="lp-u-head">
            <span className="lp-u-star"><Icon name="star" /></span>
            <div><b>Tu academia</b><small>www.tudominio.cl</small></div>
          </div>
          <div className="lp-ico">
            {HERRAMIENTAS.map((n, i) => (
              <span key={n} style={{ "--i": i } as CSSProperties}><Icon name={n} /></span>
            ))}
          </div>
        </div>
        <Lista icon="check" color="var(--av-blue-600)" items={DESPUES} />
      </div>
    </div>
  );
}