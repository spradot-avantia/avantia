"use client";

// Sección "Lo que viene": ideas en exploración, sin fecha (no son funciones
// prometidas; Ley 19.496 art. 28). Las tarjetas aparecen una vez con un fade
// intercalado y se destacan al pasar el mouse o con el foco del teclado.
import type { CSSProperties } from "react";
import { FUTURE } from "./content";
import { Icon } from "./icons";
import { useAparecer } from "./useAparecer";

function FutureSketch({ icon }: { icon: string }) {
  if (icon === "bar") return <span className="lp-bar" />;
  if (icon === "dots") return <><i /><i /><i /></>;
  return <Icon name={icon as never} size={30} />;
}

export function LoQueViene() {
  const { ref, clase } = useAparecer<HTMLUListElement>(0.15, "lp-stagger");

  return (
    <>
      <div className="lp-head">
        <span className="av-overline">Lo que viene</span>
        <h2 className="av-h2">Ideas que estamos explorando</h2>
        <span className="av-badge av-badge--explore lp-sinfecha"><i />En exploración · sin fecha</span>
        <p className="av-lede">
          Estas ideas todavía no existen en Avantia y no tienen fecha de lanzamiento. Las estamos explorando con el primer grupo de fundadores.
        </p>
      </div>
      <ul ref={ref} className={`lp-future${clase}`}>
        {FUTURE.map((f, i) => (
          <li className="lp-fcard" key={f.title} tabIndex={0} style={{ "--i": i } as CSSProperties}>
            <div className="lp-sketch" aria-hidden="true"><FutureSketch icon={f.icon} /></div>
            <b>{f.title}</b>
            <p>{f.text}</p>
          </li>
        ))}
      </ul>
    </>
  );
}