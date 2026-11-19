// Cursor visible para la grabación (Playwright no dibuja el puntero en el video).
// Se inyecta con addInitScript: un punto que sigue al mouse y un pulso en cada clic.
(() => {
  const montar = () => {
    if (document.getElementById("demo-cursor")) return;
    const c = document.createElement("div");
    c.id = "demo-cursor";
    c.setAttribute("aria-hidden", "true");
    Object.assign(c.style, {
      position: "fixed", left: "0", top: "0", width: "22px", height: "22px", margin: "-11px 0 0 -11px",
      borderRadius: "50%", background: "rgba(23,33,43,.55)", border: "2px solid #fff",
      boxShadow: "0 1px 6px rgba(0,0,0,.35)", pointerEvents: "none", zIndex: "2147483647",
      transition: "transform .12s ease", transform: "translate(-100px,-100px)",
    });
    document.documentElement.appendChild(c);
    let x = -100, y = -100;
    addEventListener("mousemove", (e) => { x = e.clientX; y = e.clientY; c.style.transform = `translate(${x}px,${y}px)`; }, true);
    addEventListener("mousedown", () => { c.style.transform = `translate(${x}px,${y}px) scale(.7)`; c.style.background = "rgba(15,118,110,.8)"; }, true);
    addEventListener("mouseup", () => { c.style.transform = `translate(${x}px,${y}px)`; c.style.background = "rgba(23,33,43,.55)"; }, true);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", montar); else montar();
})();
