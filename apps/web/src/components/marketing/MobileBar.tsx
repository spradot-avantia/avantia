"use client";

import { useEffect, useState } from "react";

// Botón fijo inferior en móvil: aparece cuando ni el formulario del hero
// ni la sección final están en pantalla.
export function MobileBar() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("hero-form");
    const final = document.getElementById("crear");
    if (!hero || !final || !("IntersectionObserver" in window)) return;

    let heroVisible = true;
    let finalVisible = false;
    const update = () => setShow(!heroVisible && !finalVisible);

    const heroObs = new IntersectionObserver(([e]) => {
      heroVisible = e.isIntersecting;
      update();
    });
    const finalObs = new IntersectionObserver(([e]) => {
      finalVisible = e.isIntersecting;
      update();
    });
    heroObs.observe(hero);
    finalObs.observe(final);
    return () => {
      heroObs.disconnect();
      finalObs.disconnect();
    };
  }, []);

  return (
    <div className={`mbar${show ? " show" : ""}`}>
      <a className="btn btn-primary" href="#crear">Empieza a crear</a>
    </div>
  );
}