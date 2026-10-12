"use client";

import { useState, type CSSProperties, type KeyboardEvent } from "react";
import { DEMO_SWATCHES, FUTURE, STEPS_CREATOR, STEPS_STUDENT } from "./content";
import { Icon } from "./icons";

const TABS = [
  { id: "creador", label: "Creador" },
  { id: "alumno", label: "Alumno" },
  { id: "futuro", label: "Lo que viene" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const GRIP = <Icon name="grip" size={16} />;

function Browser({ url, children }: { url: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="lp-browser">
      <div className="lp-bbar">
        <span className="lp-dots"><i /><i /><i /></span>
        <span className="lp-url">{url}</span>
      </div>
      {children}
    </div>
  );
}

function Note() {
  return <p className="lp-dnote">Vista de ejemplo, fiel a lo disponible. Se reemplaza por capturas reales antes de publicar.</p>;
}

function Steps({ list, cur, onPick, label }: { list: { title: string; desc: string }[]; cur: number; onPick: (i: number) => void; label: string }) {
  return (
    <ol className="lp-steps" aria-label={label}>
      {list.map((s, i) => (
        <li key={s.title}>
          <button type="button" className={`lp-step${i === cur ? " is-on" : ""}`} aria-current={i === cur ? "step" : undefined} onClick={() => onPick(i)}>
            <span className="k">{i + 1}</span>
            <b>{s.title}</b>
            <span className="d">{s.desc}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}

function FutureSketch({ icon }: { icon: string }) {
  if (icon === "bar") return <span className="lp-bar" />;
  if (icon === "dots") return <><i /><i /><i /></>;
  return <Icon name={icon as never} size={30} />;
}

export function DemoTabs() {
  const [tab, setTab] = useState<TabId>("creador");
  const [sc, setSc] = useState(0);
  const [sa, setSa] = useState(0);
  const [dm, setDm] = useState<string>(DEMO_SWATCHES[0].c);

  function onKey(e: KeyboardEvent<HTMLDivElement>) {
    const i = TABS.findIndex((t) => t.id === tab);
    let n = i;
    if (e.key === "ArrowRight") n = (i + 1) % TABS.length;
    else if (e.key === "ArrowLeft") n = (i - 1 + TABS.length) % TABS.length;
    else return;
    e.preventDefault();
    setTab(TABS[n].id);
    document.getElementById(`tab-${TABS[n].id}`)?.focus();
  }

  return (
    <>
      <div className="lp-tabs" role="tablist" aria-label="Vistas de la demo" onKeyDown={onKey}>
        {TABS.map((t) => (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            role="tab"
            type="button"
            className={`lp-tab${t.id === tab ? " is-on" : ""}`}
            aria-selected={t.id === tab}
            aria-controls="demo-panel"
            tabIndex={t.id === tab ? 0 : -1}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div id="demo-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === "creador" && (
          <div className="lp-demo">
            <div className="lp-dstage">
              <span className="av-badge av-badge--ok"><i />Disponible</span>
              {sc === 0 && (
                <Browser url="Panel · Marca">
                  <div className="lp-pui lp-split" style={{ "--brand": dm } as CSSProperties}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <div className="lp-ui-h">Tu marca</div>
                      <div className="lp-ui-row"><span className="lp-ui-lbl">Logo</span><div className="lp-ui-logo"><span className="lp-ac-mark">M</span></div></div>
                      <div className="lp-ui-row">
                        <span className="lp-ui-lbl">Color principal · pruébalo</span>
                        <div className="lp-ui-sw">
                          {DEMO_SWATCHES.map((d) => (
                            <button key={d.c} type="button" className={d.c === dm ? "is-on" : ""} style={{ background: d.c }} aria-pressed={d.c === dm} aria-label={d.label} onClick={() => setDm(d.c)} />
                          ))}
                        </div>
                      </div>
                      <div className="lp-ui-row"><span className="lp-ui-lbl">Dominio</span><div className="lp-ui-field"><span>www.tudominio.cl</span><span className="lp-ui-ok"><i />Conectado</span></div></div>
                    </div>
                    <div className="lp-ui-row">
                      <span className="lp-ui-lbl">Vista previa</span>
                      <div className="lp-mini">
                        <div className="lp-ac-top"><div className="lp-ac-brand"><span className="lp-ac-mark">M</span>Academia Mar</div></div>
                        <div className="lp-ac-cover"><small>Curso online</small><strong>Finanzas para independientes</strong></div>
                        <div style={{ padding: "0 10px 10px" }}><div className="lp-ac-cta" style={{ margin: 0 }}>Inscribirme</div></div>
                      </div>
                    </div>
                  </div>
                </Browser>
              )}
              {sc === 1 && (
                <Browser url="Panel · Cursos">
                  <div className="lp-pui">
                    <div className="lp-ui-h">Finanzas para independientes <span className="av-badge av-badge--verify">Verificar estructura</span></div>
                    <div className="lp-mod-row">{GRIP}<b>1 · Ordena tus ingresos</b><em>Video</em></div>
                    <div className="lp-mod-row">{GRIP}<b>2 · Tu presupuesto mensual</b><em>Texto</em></div>
                    <div className="lp-mod-row">{GRIP}<b>3 · Impuestos sin sustos</b><em>Video</em></div>
                    <div className="lp-add-row"><Icon name="plus" size={16} />Agregar módulo</div>
                  </div>
                </Browser>
              )}
              {sc === 2 && (
                <Browser url="Panel · Venta">
                  <div className="lp-pui">
                    <div className="lp-ui-h">Inscripciones</div>
                    <div className="lp-ui-row"><span className="lp-ui-lbl">Precio del curso (ejemplo)</span><div className="lp-ui-field"><span>$ 49.990 CLP</span></div></div>
                    <div className="lp-ui-row"><span className="lp-ui-lbl">Enlace de inscripción</span><div className="lp-ui-field"><span className="lp-ellip">www.tudominio.cl/finanzas</span><span className="lp-ui-ok" style={{ color: "var(--av-blue-700)" }}>Copiar</span></div></div>
                    <div className="lp-ui-row"><span className="lp-ui-lbl">Pagos</span><div className="lp-ui-field"><span>Tus alumnos pagan dentro de tu academia</span></div></div>
                  </div>
                </Browser>
              )}
              <Note />
            </div>
            <Steps list={STEPS_CREATOR} cur={sc} onPick={setSc} label="Pasos del Creador" />
          </div>
        )}

        {tab === "alumno" && (
          <div className="lp-demo" style={{ "--brand": "#0e7490" } as CSSProperties}>
            <div className="lp-dstage">
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <span className="av-badge av-badge--ok"><i />Disponible</span>
                <span className="av-badge av-badge--verify">Verificar versión móvil</span>
              </div>
              {sa === 0 && (
                <Browser url="Bandeja de entrada">
                  <div className="lp-mail">
                    <div className="lp-mail-from"><span className="lp-ac-mark">M</span><div><b>Academia Mar</b><span>hola@tudominio.cl</span></div></div>
                    <h4>Te damos la bienvenida a Finanzas para independientes</h4>
                    <p>Ya tienes acceso a tu curso. Entra cuando quieras desde www.tudominio.cl.</p>
                    <span className="lp-fake-btn">Ir a mi curso</span>
                  </div>
                </Browser>
              )}
              {sa === 1 && (
                <Browser url={<><Icon name="lock" size={12} />www.tudominio.cl</>}>
                  <div>
                    <div className="lp-ac-top" style={{ paddingTop: 12 }}>
                      <div className="lp-ac-brand"><span className="lp-ac-mark">M</span>Academia Mar</div>
                      <span style={{ fontSize: 12, color: "var(--av-muted)" }}>Mi cuenta</span>
                    </div>
                    <div className="lp-ac-cover" style={{ marginBottom: 12 }}><small>Tu curso</small><strong>Finanzas para independientes</strong><span>3 módulos</span></div>
                  </div>
                </Browser>
              )}
              {sa === 2 && (
                <Browser url={<><Icon name="lock" size={12} />www.tudominio.cl/finanzas</>}>
                  <div className="lp-checkout">
                    <div className="lp-ac-brand"><span className="lp-ac-mark">M</span>Academia Mar</div>
                    <div className="lp-line"><span>Finanzas para independientes</span><b>$ 49.990</b></div>
                    <div className="lp-ac-cta" style={{ margin: 0 }}>Pagar inscripción</div>
                    <span className="av-badge av-badge--verify">Medios de pago por confirmar</span>
                  </div>
                </Browser>
              )}
              <Note />
            </div>
            <Steps list={STEPS_STUDENT} cur={sa} onPick={setSa} label="Pasos del alumno" />
          </div>
        )}

        {tab === "futuro" && (
          <div className="lp-dstage" style={{ minHeight: 0 }}>
            <span className="av-badge av-badge--explore"><i />En exploración</span>
            <p style={{ color: "var(--av-muted)", maxWidth: "62ch" }}>
              Estas ideas todavía no existen en Avantia. Las estamos explorando con el primer grupo de fundadores.
            </p>
            <ul className="lp-future">
              {FUTURE.map((f) => (
                <li className="lp-fcard" key={f.title}>
                  <div className="lp-sketch" aria-hidden="true"><FutureSketch icon={f.icon} /></div>
                  <b>{f.title}</b>
                  <p>{f.text}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
