// Landing pública de Avantia (Server Component).
// Solo los formularios, el footer y la barra móvil son Client Components.

import type { CSSProperties, ReactNode } from "react";
import { Inter } from "next/font/google";
import { Icon, IconSprite, type IconId } from "./icons";
import { SignupProvider } from "./SignupContext";
import { HeroForm } from "./HeroForm";
import { ApplyForm } from "./ApplyForm";
import { Footer } from "./Footer";
import { MobileBar } from "./MobileBar";
import "./landing.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--av-font",
  display: "swap",
});

// ---------- Contenido ----------

const INDUSTRIES = ["Minería", "Energía", "Construcción", "Logística", "Retail", "Finanzas", "Salud"];

const MODULES = [
  { n: 1, title: "Leer un contrato como un riesgo", sub: "Caso: la cláusula de reajuste", lessons: 3 },
  { n: 2, title: "Preparar la negociación", sub: "Tu método: mapa de alternativas", lessons: 4 },
  { n: 3, title: "Cuando el proveedor tiene el poder", sub: "Caso: proveedor único", lessons: 3 },
];

const STEPS = [
  ["Cuenta lo que sabes", "Conversa con la IA de Avantia o sube tus presentaciones, notas y videos."],
  ["Avantia lo ordena", "Tu experiencia se convierte en módulos, casos interactivos y evaluaciones."],
  ["Revisas y publicas", "Ajustas lo que quieras con tu voz. Nada se publica sin tu aprobación."],
  ["Enseñas y creces", "Llegas a profesionales y empresas, respondes en la comunidad y ves qué funciona."],
];

const FEATURES: { icon: IconId; title: string; text: string; lead?: boolean }[] = [
  {
    icon: "i-mic",
    title: "Estudio con IA",
    text: "Una entrevista guiada rescata tus casos, decisiones y métodos, y propone la estructura del curso. Tú editas, la IA no habla por ti.",
    lead: true,
  },
  { icon: "i-case", title: "Casos interactivos", text: "Tus estudiantes deciden antes de ver lo que hiciste tú." },
  { icon: "i-live", title: "Sesiones en vivo", text: "Suma mentorías y clases en grupo a tu curso." },
  { icon: "i-people", title: "Comunidad", text: "Un espacio para que tus estudiantes pregunten, compartan y se conozcan." },
  { icon: "i-chart", title: "Analítica de aprendizaje", text: "Ve dónde avanzan, dónde se traban y qué lecciones mejorar." },
  { icon: "i-cert", title: "Certificados", text: "Tus estudiantes reciben un certificado con tu nombre y el de Avantia." },
];

const OPTIONS = [
  { key: "A", text: "Aceptar el alza para no arriesgar la operación" },
  { key: "B", text: "Revisar qué gatilla exactamente la cláusula", selected: true },
  { key: "C", text: "Buscar de inmediato otro proveedor" },
];

const PROGRESS = [
  ["1. Leer un contrato como un riesgo", 92],
  ["2. Preparar la negociación", 80],
  ["3. Cuando el proveedor tiene el poder", 64],
] as const;

const AUDIENCES = [
  {
    tag: "Creadores",
    title: "Enseña lo que aprendiste en terreno",
    items: ["Crea tu curso con ayuda de la IA", "Llega a profesionales y empresas", "Haz crecer tu marca como experto"],
    ctas: [{ label: "Empieza a crear", href: "#crear", primary: true }],
    here: true,
  },
  {
    tag: "Profesionales",
    title: "Aprende de quienes ya lo hicieron",
    items: ["Cursos basados en casos reales", "Preguntas directas a expertos", "Certificados para tu carrera"],
    ctas: [{ label: "Explorar cursos", href: "#top", primary: false }],
  },
  {
    tag: "Empresas",
    title: "Forma a tus equipos con expertos de tu industria",
    items: ["Programas para equipos completos", "Seguimiento del avance por persona", "Cursos a medida con Creadores"],
    ctas: [
      { label: "Solicitar demo", href: "#crear", primary: true },
      { label: "Descargar guía", href: "#top", primary: false },
    ],
  },
];

const TRUST = [
  ["Propiedad del contenido", "Tus casos y métodos te pertenecen. No los usamos sin tu aprobación."],
  ["Tú tienes la última palabra", "La IA propone; nada se publica sin tu revisión."],
  ["Datos cuidados", "No vendemos tus datos ni los de tus estudiantes."],
  ["Accesible para todos", "Diseñado según las pautas WCAG 2.1 AA."],
];

const FAQ = [
  ["¿Necesito experiencia enseñando?", "No. Necesitas experiencia real en tu industria. Avantia te ayuda a convertirla en un curso."],
  ["¿La IA va a escribir el curso por mí?", "La IA ordena lo que tú cuentas y propone una estructura. El contenido, los casos y la voz son tuyos, y tú apruebas todo antes de publicar."],
  ["¿Cuánto tiempo toma crear un curso?", "Mucho menos que hacerlo solo. La parte más larga es la conversación inicial; Avantia se encarga de darle forma."],
  ["¿Puedo ofrecer mi curso a empresas?", "Sí. Tu curso puede llegar a profesionales individuales y también a equipos de empresas de tu industria."],
  ["¿De quién es el contenido?", "Tuyo. Avantia no usa tus casos ni tus métodos sin tu autorización."],
];

// ---------- Piezas reutilizables ----------

function SectionHead({ eyebrow, title, id, lead }: { eyebrow: string; title: string; id: string; lead?: string }) {
  return (
    <div className="sec-head">
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={id}>{title}</h2>
      {lead && <p className="lead">{lead}</p>}
    </div>
  );
}

function MockWindow({ label, title, children }: { label: string; title: string; children: ReactNode }) {
  return (
    <div className="mock" role="img" aria-label={label}>
      <div className="mock-bar">
        <i />
        <i />
        <i />
        <b>{title}</b>
      </div>
      <div className="mock-body">{children}</div>
    </div>
  );
}

function Points({ items }: { items: [string, string][] }) {
  return (
    <div className="learner-points">
      {items.map(([strong, text]) => (
        <div key={strong}>
          <strong>{strong}</strong>
          <span>{text}</span>
        </div>
      ))}
    </div>
  );
}

const inkStyle: CSSProperties = { color: "var(--ink)" };

// ---------- Página ----------

export default function Landing() {
  return (
    <div className={`av-landing ${inter.variable}`}>
      <IconSprite />
      <a className="skip" href="#main">Ir al contenido</a>

      <header className="nav">
        <div className="wrap">
          <a className="brand" href="#top" aria-label="avantia, inicio">
            <Icon id="mono" />
            avantia
          </a>
          <nav className="nav-links" aria-label="Principal">
            <a href="#producto">Plataforma</a>
            <a href="#para-quien">Para empresas</a>
            <a href="#para-quien">Aprender</a>
            <a href="#preguntas">Preguntas</a>
            <a className="btn btn-primary btn-sm" href="#crear">Empieza a crear</a>
          </nav>
        </div>
      </header>

      <SignupProvider>
        <main id="main">
          {/* 1. Hero */}
          <section className="hero" id="top" aria-labelledby="hero-title">
            <div className="wrap">
              <div>
                <p className="eyebrow">Avantia para Creadores</p>
                <h1 id="hero-title">
                  <span className="soft">La información está al alcance de todos.</span> Tu experiencia,{" "}
                  <span className="yet">aún no.</span>
                </h1>
                <p className="lead">
                  Avantia convierte lo que aprendiste en años de trabajo en cursos prácticos. Conversas con nuestra IA,
                  ella ordena tu experiencia en lecciones y casos, y tú enseñas a profesionales y equipos de tu
                  industria.
                </p>
                <HeroForm />
                <div className="reassure">
                  <span>
                    <Icon id="check" />
                    No necesitas saber grabar ni diseñar clases
                  </span>
                  <span>
                    <Icon id="check" />
                    Tu contenido es tuyo
                  </span>
                </div>
                <a className="secondary-link" href="#producto">Ver la plataforma ↓</a>
              </div>

              <figure style={{ margin: 0 }}>
                <MockWindow
                  title="Estudio del Creador"
                  label="Estudio del Creador: la IA de Avantia detecta decisiones clave en una entrevista y propone un curso de módulos basados en casos."
                >
                  <div className="mock-title">
                    <div>
                      <small>Tu curso</small>
                      <strong>Negociar contratos de suministro en minería</strong>
                    </div>
                    <span className="ai-badge">IA de Avantia</span>
                  </div>
                  <div className="insight">
                    <strong style={inkStyle}>De tu entrevista de 45 minutos</strong>
                    Encontramos 5 decisiones clave, 3 casos reales y 1 método propio. Te proponemos esta estructura:
                  </div>
                  <ol className="modules">
                    {MODULES.map((m) => (
                      <li key={m.n}>
                        <span className="n">{m.n}</span>
                        <span className="t">
                          {m.title}
                          <span>{m.sub}</span>
                        </span>
                        <span className="k">{m.lessons} lecciones</span>
                      </li>
                    ))}
                  </ol>
                  <div className="mock-foot">
                    <span>Listo para tu revisión</span>
                    <button className="btn btn-primary btn-sm" type="button" tabIndex={-1} aria-hidden="true">
                      Revisar y publicar
                    </button>
                  </div>
                </MockWindow>
                <figcaption className="mock-note">Ejemplo ilustrativo del Estudio del Creador.</figcaption>
              </figure>
            </div>
          </section>

          <div className="industries" aria-label="Industrias">
            <div className="wrap">
              <p>Hecho para expertos de</p>
              <ul>
                {INDUSTRIES.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* 2. Problema */}
          <section aria-labelledby="gap-title">
            <div className="wrap">
              <SectionHead
                eyebrow="Por qué Avantia"
                title="Lo que sabes no aparece en un buscador"
                id="gap-title"
                lead="Internet está lleno de teoría. Lo que falta es el criterio de quien ya estuvo ahí. Hoy ese conocimiento se transmite de a una persona a la vez. Avantia lo lleva a cientos."
              />
              <div className="compare">
                <div className="col web">
                  <span className="col-tag">Lo que cualquiera encuentra</span>
                  <h3>Información</h3>
                  <ul>
                    {[
                      "Definiciones, marcos y tutoriales",
                      "Casos genéricos que no se parecen a tu industria",
                      "Respuestas correctas, sin contexto",
                    ].map((t) => (
                      <li key={t}>
                        <Icon id="dot" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="col yours">
                  <span className="col-tag">Lo que solo tú tienes</span>
                  <h3>Experiencia</h3>
                  <ul>
                    {[
                      "Decisiones que tomaste con poca información y mucha presión",
                      "Errores que costaron caro y lo que cambiaste después",
                      "Tus propios métodos, probados en terreno",
                    ].map((t) => (
                      <li key={t}>
                        <Icon id="check" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* 3. Cómo funciona */}
          <section className="gap" id="como" aria-labelledby="como-title">
            <div className="wrap">
              <SectionHead
                eyebrow="Cómo funciona"
                title="De una conversación a un curso publicado"
                id="como-title"
                lead="Tú pones lo que sabes. Avantia hace el trabajo de darle forma."
              />
              <ol className="steps">
                {STEPS.map(([title, text], i) => (
                  <li key={title}>
                    <span className="num">Paso {i + 1}</span>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* 4. Plataforma */}
          <section id="producto" aria-labelledby="prod-title">
            <div className="wrap">
              <SectionHead eyebrow="La plataforma" title="Todo lo que necesitas para enseñar lo que sabes" id="prod-title" />
              <div className="features">
                {FEATURES.map((f) => (
                  <div key={f.title} className={`feature${f.lead ? " lead-f" : ""}`}>
                    <span className="ic">
                      <Icon id={f.icon} />
                    </span>
                    <h3>{f.title}</h3>
                    <p>{f.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 5. Vista del estudiante */}
          <section className="learner gap" aria-labelledby="learner-title">
            <div className="wrap">
              <div>
                <p className="eyebrow">Lo que viven tus estudiantes</p>
                <h2 id="learner-title">Aprenden de tus casos, no de un manual</h2>
                <Points
                  items={[
                    ["Situaciones reales", "Cada lección parte de algo que tú viviste."],
                    ["Deciden antes de ver la respuesta", "Practican el criterio, no solo memorizan."],
                    ["Tu mirada al final", "Ven qué hiciste tú y por qué."],
                  ]}
                />
              </div>
              <figure style={{ margin: 0 }}>
                <MockWindow
                  title="Módulo 1 · Lección 2"
                  label="Vista del estudiante: un caso práctico con tres opciones y el comentario del experto."
                >
                  <div className="case">
                    <h4>Caso: el reajuste inesperado</h4>
                    <p>
                      Tu proveedor de repuestos críticos invoca una cláusula y sube el precio un 18% a mitad de
                      contrato. La planta no puede parar. ¿Qué haces primero?
                    </p>
                  </div>
                  <div className="options">
                    {OPTIONS.map((o) => (
                      <div key={o.key} className={`opt${o.selected ? " sel" : ""}`}>
                        <b>{o.key}</b>
                        {o.text}
                      </div>
                    ))}
                  </div>
                  <div className="expert-note">
                    <span className="avatar" aria-hidden="true">CR</span>
                    <span>
                      <strong>Lo que hice yo:</strong> pedí el cálculo del índice de reajuste. Estaba mal aplicado y
                      el alza real era la mitad.
                    </span>
                  </div>
                </MockWindow>
                <figcaption className="mock-note">Ejemplo ilustrativo de una lección.</figcaption>
              </figure>
            </div>
          </section>

          {/* Analítica */}
          <section className="learner" aria-labelledby="data-title">
            <div className="wrap" style={{ gridTemplateColumns: "1.1fr .9fr" }}>
              <figure style={{ margin: 0 }}>
                <MockWindow
                  title="Panel del Creador"
                  label="Panel del Creador con estudiantes activos, tasa de finalización, preguntas en la comunidad y avance por módulo."
                >
                  <div className="stats">
                    <div className="stat">
                      <small>Estudiantes activos</small>
                      <strong>312</strong>
                      <em>+48 este mes</em>
                    </div>
                    <div className="stat">
                      <small>Terminan el curso</small>
                      <strong>71%</strong>
                      <em>+6 pts</em>
                    </div>
                    <div className="stat">
                      <small>Preguntas abiertas</small>
                      <strong>9</strong>
                      <small>en la comunidad</small>
                    </div>
                  </div>
                  <div className="bars">
                    {PROGRESS.map(([label, pct]) => (
                      <div key={label} className="bar-row">
                        <span>{label}</span>
                        <div className="meter">
                          <span style={{ "--w": `${pct}%` } as CSSProperties} />
                        </div>
                        <b>{pct}%</b>
                      </div>
                    ))}
                  </div>
                  <div className="insight">
                    <strong style={inkStyle}>Sugerencia</strong>
                    Muchos estudiantes repiten la lección 3.2. Un ejemplo adicional podría ayudar.
                  </div>
                </MockWindow>
                <figcaption className="mock-note">Ejemplo ilustrativo con datos de muestra.</figcaption>
              </figure>
              <div>
                <p className="eyebrow">Mejora con datos</p>
                <h2 id="data-title">Sabes qué funciona y qué no</h2>
                <Points
                  items={[
                    ["Avance por módulo", "Ve en qué parte del curso se quedan tus estudiantes."],
                    ["Sugerencias para mejorar", "Avantia te avisa qué lección conviene reforzar."],
                    ["La comunidad en un vistazo", "Responde las preguntas que importan sin perderte ninguna."],
                  ]}
                />
              </div>
            </div>
          </section>

          {/* 6. Audiencias */}
          <section className="gap" id="para-quien" aria-labelledby="aud-title">
            <div className="wrap">
              <SectionHead eyebrow="Para quién es Avantia" title="Un lugar donde la experiencia se comparte" id="aud-title" />
              <div className="audiences">
                {AUDIENCES.map((a) => (
                  <div key={a.tag} className={`aud${a.here ? " here" : ""}`}>
                    <span className="col-tag" style={a.here ? { color: "var(--accent)" } : undefined}>
                      {a.tag}
                    </span>
                    <h3>{a.title}</h3>
                    <ul>
                      {a.items.map((i) => (
                        <li key={i}>{i}</li>
                      ))}
                    </ul>
                    <div className="ctas">
                      {a.ctas.map((c) => (
                        <a key={c.label} className={`btn btn-sm ${c.primary ? "btn-primary" : "btn-ghost"}`} href={c.href}>
                          {c.label}
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 7. Confianza */}
          <section aria-labelledby="trust-title">
            <div className="wrap">
              <SectionHead eyebrow="Tu conocimiento, protegido" title="Lo que es tuyo, sigue siendo tuyo" id="trust-title" />
              <div className="trust-grid">
                {TRUST.map(([title, text]) => (
                  <div key={title} className="trust-item">
                    <Icon id="check" />
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 8. Preguntas */}
          <section className="gap" id="preguntas" aria-labelledby="faq-title">
            <div className="wrap">
              <SectionHead eyebrow="Preguntas frecuentes" title="Lo que suelen preguntarnos" id="faq-title" />
              <div className="faq">
                {FAQ.map(([q, a]) => (
                  <details key={q}>
                    <summary>{q}</summary>
                    <p>{a}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          {/* 9. CTA final */}
          <section className="final" id="crear" aria-labelledby="final-title">
            <div className="wrap">
              <div className="panel">
                <div>
                  <h2 id="final-title">Tu experiencia merece llegar más lejos</h2>
                  <p className="lead">Crea tu cuenta de Creador y empieza tu primer curso hoy.</p>
                </div>
                <ApplyForm />
              </div>
            </div>
          </section>
        </main>
      </SignupProvider>

      <Footer />
      <MobileBar />
    </div>
  );
}