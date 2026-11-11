"use client";

import { useEffect, useState, type CSSProperties, type KeyboardEvent } from "react";
import { DEMO_SWATCHES, STEPS_CREATOR, STEPS_STUDENT } from "./content";
import { Icon } from "./icons";

const TABS = [
  { id: "creador", label: "Creador" },
  { id: "alumno", label: "Alumno" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const GRIP = <Icon name="grip" size={16} />;

/** Dominio del simulador: minúsculas, sin protocolo ni "www.", solo caracteres válidos. */
function limpiarDominio(v: string): string {
  return v
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[^a-z0-9ñ.-]/g, "")
    .slice(0, 40);
}

/** Slug corto para el enlace de ejemplo: "Finanzas para independientes" → "finanzas-para-independientes". */
function slug(v: string): string {
  return (
    v
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32)
      .replace(/-+$/, "") || "curso"
  );
}

/** Lo que el creador escribe en el enlace: minúsculas, guiones en vez de espacios. */
function limpiarSlug(v: string): string {
  return v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 40);
}

// Monedas del simulador: el precio se escribe en enteros y se muestra con puntos de miles.
const MONEDAS = {
  CLP: { simbolo: "$", ejemplo: "49990" },
  USD: { simbolo: "US$", ejemplo: "49" },
} as const;
type Moneda = keyof typeof MONEDAS;
const MILES = new Intl.NumberFormat("es-CL");

// Formas de cobro del simulador: cambian el precio y el botón que ve el alumno.
const PAGOS = {
  online: { etiqueta: "Tus alumnos pagan dentro de tu academia", boton: "Pagar inscripción" },
  transferencia: { etiqueta: "Transferencia bancaria (tú activas el acceso)", boton: "Ver datos para transferir" },
  gratis: { etiqueta: "Curso gratis", boton: "Inscribirme gratis" },
} as const;
type Pago = keyof typeof PAGOS;

// Módulos del simulador: de 1 a 4, con nombre y tipo de lección editables.
const MAX_MODULOS = 4;
type Modulo = { id: number; titulo: string; tipo: "Video" | "Texto" };
const MODULOS_INICIALES: Modulo[] = [
  { id: 1, titulo: "Ordena tus ingresos", tipo: "Video" },
  { id: 2, titulo: "Tu presupuesto mensual", tipo: "Texto" },
  { id: 3, titulo: "Impuestos sin sustos", tipo: "Video" },
];

/** Campo de texto del simulador (solo cambia la vista previa; no guarda nada). */
function Campo({ id, label, value, onChange, placeholder, max }: { id: string; label: string; value: string; onChange: (v: string) => void; placeholder: string; max: number }) {
  return (
    <div className="lp-ui-row">
      <label className="lp-ui-lbl" htmlFor={id}>{label}</label>
      <div className="lp-ui-field lp-ui-field--edit">
        <input id={id} type="text" autoComplete="off" placeholder={placeholder} value={value} maxLength={max} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}

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

export function DemoTabs() {
  const [tab, setTab] = useState<TabId>("creador");
  const [sc, setSc] = useState(0);
  const [sa, setSa] = useState(0);
  const [dm, setDm] = useState<string>(DEMO_SWATCHES[0].c);
  const [dom, setDom] = useState("");
  const web = `www.${dom || "tudominio.cl"}`;
  const [nombre, setNombre] = useState("");
  const [curso, setCurso] = useState("");
  const nombreVer = nombre.trim() || "Academia Mar";
  const cursoVer = curso.trim() || "Finanzas para independientes";
  const inicial = nombreVer.charAt(0).toLocaleUpperCase("es");
  const [precio, setPrecio] = useState(""); // solo dígitos
  const [moneda, setMoneda] = useState<Moneda>("CLP");
  const [pago, setPago] = useState<Pago>("online");
  const [slugMan, setSlugMan] = useState<string | null>(null); // null = sigue al nombre del curso
  const precioVer = pago === "gratis" ? "Gratis" : `${MONEDAS[moneda].simbolo} ${MILES.format(Number(precio || MONEDAS[moneda].ejemplo))}`;
  const slugCampo = slugMan ?? slug(cursoVer);
  const slugVer = slugCampo.replace(/^-+|-+$/g, "") || "curso";
  const [mods, setMods] = useState<Modulo[]>(MODULOS_INICIALES);
  const [sigId, setSigId] = useState(MODULOS_INICIALES.length + 1);
  const [enfocar, setEnfocar] = useState<number | null>(null);

  // Lleva el foco al módulo recién agregado, después de que aparece en pantalla.
  useEffect(() => {
    if (enfocar == null) return;
    document.getElementById(`demo-mod-${enfocar}`)?.focus();
    setEnfocar(null);
  }, [enfocar]);

  function editarModulo(id: number, cambio: Partial<Modulo>) {
    setMods((ms) => ms.map((m) => (m.id === id ? { ...m, ...cambio } : m)));
  }
  function agregarModulo() {
    if (mods.length >= MAX_MODULOS) return;
    const id = sigId;
    setSigId(id + 1);
    setMods((ms) => [...ms, { id, titulo: "", tipo: "Video" }]);
    setEnfocar(id);
  }
  function quitarModulo(id: number) {
    setMods((ms) => (ms.length > 1 ? ms.filter((m) => m.id !== id) : ms));
  }

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
                      <div className="lp-ui-row"><span className="lp-ui-lbl">Logo</span><div className="lp-ui-logo"><span className="lp-ac-mark">{inicial}</span></div></div>
                      <Campo id="demo-nombre" label="Nombre de tu academia" placeholder="Academia Mar" value={nombre} onChange={setNombre} max={30} />
                      <Campo id="demo-curso" label="Nombre del curso" placeholder="Finanzas para independientes" value={curso} onChange={setCurso} max={48} />
                      <div className="lp-ui-row">
                        <span className="lp-ui-lbl">Color principal · pruébalo</span>
                        <div className="lp-ui-sw">
                          {DEMO_SWATCHES.map((d) => (
                            <button key={d.c} type="button" className={d.c === dm ? "is-on" : ""} style={{ background: d.c }} aria-pressed={d.c === dm} aria-label={d.label} onClick={() => setDm(d.c)} />
                          ))}
                        </div>
                      </div>
                      <div className="lp-ui-row">
                        <label className="lp-ui-lbl" htmlFor="demo-dominio">Dominio · escribe el tuyo</label>
                        <div className="lp-ui-field lp-ui-field--edit">
                          <span aria-hidden="true">www.</span>
                          <input
                            id="demo-dominio"
                            type="text"
                            inputMode="url"
                            autoComplete="off"
                            autoCapitalize="none"
                            spellCheck={false}
                            placeholder="tudominio.cl"
                            value={dom}
                            maxLength={40}
                            aria-describedby="demo-dominio-nota"
                            onChange={(e) => setDom(limpiarDominio(e.target.value))}
                          />
                          <span className="lp-ui-prev" id="demo-dominio-nota">Solo vista previa</span>
                        </div>
                      </div>
                    </div>
                    <div className="lp-ui-row">
                      <span className="lp-ui-lbl">Vista previa</span>
                      <div className="lp-mini">
                        <div className="lp-mini-url"><Icon name="lock" size={12} /><span className="lp-ellip">{web}</span></div>
                        <div className="lp-ac-top"><div className="lp-ac-brand"><span className="lp-ac-mark">{inicial}</span>{nombreVer}</div></div>
                        <div className="lp-ac-cover"><small>Curso online</small><strong>{cursoVer}</strong></div>
                        <div style={{ padding: "0 10px 10px" }}><div className="lp-ac-cta lp-ac-cta--demo" style={{ margin: 0 }} aria-hidden="true">Inscribirme</div></div>
                      </div>
                    </div>
                  </div>
                </Browser>
              )}
              {sc === 1 && (
                <Browser url="Panel · Cursos">
                  <div className="lp-pui">
                    <Campo id="demo-curso-2" label="Nombre del curso" placeholder="Finanzas para independientes" value={curso} onChange={setCurso} max={48} />
                    <div className="lp-ui-row">
                      <span className="lp-ui-lbl" id="demo-mods-lbl">Módulos · {mods.length} de {MAX_MODULOS}</span>
                      <p className="lp-ui-hint"><Icon name="pencil" size={14} />Pruébalo: toca un nombre para cambiarlo, elige Video o Texto y agrega o quita módulos.</p>
                    </div>
                    <ol className="lp-mod-list" aria-labelledby="demo-mods-lbl">
                      {mods.map((m, i) => (
                        <li key={m.id} className="lp-mod-row lp-mod-row--edit">
                          {GRIP}
                          <span className="lp-mod-n" aria-hidden="true">{i + 1}</span>
                          <label className="lp-mod-edit">
                            <input
                              id={`demo-mod-${m.id}`}
                              className="lp-mod-in"
                              type="text"
                              autoComplete="off"
                              placeholder={`Módulo ${i + 1}`}
                              aria-label={`Nombre del módulo ${i + 1}`}
                              value={m.titulo}
                              maxLength={40}
                              onChange={(e) => editarModulo(m.id, { titulo: e.target.value })}
                            />
                            <Icon name="pencil" size={14} />
                          </label>
                          <select
                            className="lp-ui-moneda"
                            aria-label={`Tipo de lección del módulo ${i + 1}`}
                            value={m.tipo}
                            onChange={(e) => editarModulo(m.id, { tipo: e.target.value as Modulo["tipo"] })}
                          >
                            <option value="Video">Video</option>
                            <option value="Texto">Texto</option>
                          </select>
                          <button
                            type="button"
                            className="lp-mod-x"
                            aria-label={`Eliminar el módulo ${i + 1}`}
                            disabled={mods.length === 1}
                            onClick={() => quitarModulo(m.id)}
                          >
                            <Icon name="x" size={16} />
                          </button>
                        </li>
                      ))}
                    </ol>
                    <button type="button" className="lp-add-row" disabled={mods.length >= MAX_MODULOS} onClick={agregarModulo}>
                      {mods.length >= MAX_MODULOS ? (
                        <>Máximo {MAX_MODULOS} módulos</>
                      ) : (
                        <><Icon name="plus" size={16} />Agregar módulo</>
                      )}
                    </button>
                  </div>
                </Browser>
              )}
              {sc === 2 && (
                <Browser url="Panel · Venta">
                  <div className="lp-pui">
                    <div className="lp-ui-h">Inscripciones</div>
                    <div className="lp-ui-row">
                      <label className="lp-ui-lbl" htmlFor="demo-precio">Precio del curso</label>
                      <div className={`lp-ui-field lp-ui-field--edit${pago === "gratis" ? " is-off" : ""}`}>
                        <span aria-hidden="true">{MONEDAS[moneda].simbolo}&nbsp;</span>
                        <input
                          id="demo-precio"
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          placeholder={MILES.format(Number(MONEDAS[moneda].ejemplo))}
                          value={pago === "gratis" ? "" : precio ? MILES.format(Number(precio)) : ""}
                          disabled={pago === "gratis"}
                          onChange={(e) => setPrecio(e.target.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 8))}
                        />
                        <select className="lp-ui-moneda" aria-label="Moneda" value={moneda} disabled={pago === "gratis"} onChange={(e) => setMoneda(e.target.value as Moneda)}>
                          <option value="CLP">CLP</option>
                          <option value="USD">USD</option>
                        </select>
                      </div>
                    </div>
                    <div className="lp-ui-row">
                      <label className="lp-ui-lbl" htmlFor="demo-enlace">Enlace de inscripción</label>
                      <div className="lp-ui-field lp-ui-field--edit">
                        <span className="lp-ui-pre lp-ellip" aria-hidden="true">{web}/</span>
                        <input
                          id="demo-enlace"
                          type="text"
                          autoComplete="off"
                          autoCapitalize="none"
                          spellCheck={false}
                          placeholder="curso"
                          value={slugCampo}
                          onChange={(e) => setSlugMan(limpiarSlug(e.target.value))}
                        />
                        <span className="lp-ui-ok lp-ui-copiar" aria-hidden="true">Copiar</span>
                      </div>
                    </div>
                    <div className="lp-ui-row">
                      <label className="lp-ui-lbl" htmlFor="demo-pagos">Pagos</label>
                      <select id="demo-pagos" className="lp-ui-field lp-ui-select" value={pago} onChange={(e) => setPago(e.target.value as Pago)}>
                        {(Object.keys(PAGOS) as Pago[]).map((k) => (
                          <option key={k} value={k}>{PAGOS[k].etiqueta}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </Browser>
              )}
            </div>
            <Steps list={STEPS_CREATOR} cur={sc} onPick={setSc} label="Pasos del Creador" />
          </div>
        )}

        {tab === "alumno" && (
          <div className="lp-demo" style={{ "--brand": dm } as CSSProperties}>
            <div className="lp-dstage">
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <span className="av-badge av-badge--ok"><i />Disponible</span>
              </div>
              {sa === 0 && (
                <Browser url="Bandeja de entrada">
                  <div className="lp-mail">
                    <div className="lp-mail-from"><span className="lp-ac-mark">{inicial}</span><div><b>{nombreVer}</b><span>hola@{dom || "tudominio.cl"}</span></div></div>
                    <h4>Te damos la bienvenida a {cursoVer}</h4>
                    <p>Ya tienes acceso a tu curso. Entra cuando quieras desde {web}.</p>
                    <span className="lp-fake-btn">Ir a mi curso</span>
                  </div>
                </Browser>
              )}
              {sa === 1 && (
                <Browser url={<><Icon name="lock" size={12} />{web}</>}>
                  <div>
                    <div className="lp-ac-top" style={{ paddingTop: 12 }}>
                      <div className="lp-ac-brand"><span className="lp-ac-mark">{inicial}</span>{nombreVer}</div>
                      <span style={{ fontSize: 12, color: "var(--av-muted)" }}>Mi cuenta</span>
                    </div>
                    <div className="lp-ac-cover" style={{ marginBottom: 12 }}><small>Tu curso</small><strong>{cursoVer}</strong><span>{mods.length === 1 ? "1 módulo" : `${mods.length} módulos`}</span></div>
                  </div>
                </Browser>
              )}
              {sa === 2 && (
                <Browser url={<><Icon name="lock" size={12} />{web}/{slugVer}</>}>
                  <div className="lp-checkout">
                    <div className="lp-ac-brand"><span className="lp-ac-mark">{inicial}</span>{nombreVer}</div>
                    <div className="lp-line"><span>{cursoVer}</span><b>{precioVer}</b></div>
                    <div className="lp-ac-cta" style={{ margin: 0 }}>{PAGOS[pago].boton}</div>
                  </div>
                </Browser>
              )}
            </div>
            <Steps list={STEPS_STUDENT} cur={sa} onPick={setSa} label="Pasos del alumno" />
          </div>
        )}

      </div>
    </>
  );
}