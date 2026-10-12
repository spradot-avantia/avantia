# Avantia: verificación de mercado, competidores y cobro local

12 de octubre de 2026. Verifica `Mercado_Segmento_Expertos_Entrevistas.md` abriendo las páginas originales (no solo resultados de búsqueda). Convención de estado: **Sólida** (confirmada en la fuente y atribuida), **Parcial** (existe pero con matiz o sin metodología), **Corregir** (el doc anterior dice algo distinto), **Sin verificar**.

Límite general: casi todo el dato de mercado LatAm es de Hotmart (parte interesada) y nadie publica la metodología. Los precios se leyeron en las páginas oficiales cuando cargaron; donde no, se indica.

## 1. Cifras clave

| Cifra | Estado | Qué dice realmente la fuente | Fuente |
| --- | --- | --- | --- |
| US$10,8 mil M (2024) → ~US$98 mil M (2033) | **Parcial / Corregir atribución** | El artículo da ambas cifras (CAGR 27,8%) para LatAm, pero **no cita Grand View Research ni ninguna fuente**. Otras notas la atribuyen al estudio de Hotmart "Economía de Creadores en América Latina Hispanohablante" (enero 2026). "Grand View Research" no aparece en ninguna fuente abierta: quitar esa atribución. La proyección es de la parte interesada, no auditada. Además cubre toda LatAm, no solo hispanohablante. | [Mexico Business](https://mexicobusiness.news/talent/news/professionalizing-creator-economy-scale-businesses); [Emprendedor](https://emprendedor.com/economia-creadores-latam-crecimiento-negocio-digital/) |
| 74% de productores en crecimiento con <50.000 seguidores | **Parcial** | Cita literal: "Datos de Hotmart muestran que el 74% de los productores digitales en crecimiento tiene menos de 50 mil seguidores". Sin definir "en crecimiento" ni muestra. Es base de Hotmart, no del mercado. | [DPL News](https://dplnews.com/?p=320784) |
| 85% de la base regional en 7 países | **Sólida con matiz** | Semana: Colombia, México, Argentina y Perú lideran y "en conjunto con Chile, Ecuador y Bolivia" suman 85% **de la base regional de creadores** del estudio de Hotmart (27-ene-2026). Es base de creadores de Hotmart, no de todos los creadores. | [Semana](https://www.semana.com/economia/macroeconomia/articulo/colombia-lidera-la-economia-de-creadores-en-la-region/202612/) |
| 78% de compras desde celular | **Parcial / desactualizada** | "el 78 por ciento se realiza a través de dispositivos móviles" viene de **Hotmart Insights 2023** (nota de marzo 2024), no de 2026. Perfil comprador 40-59 años, estudios superiores: confirmado. **El "60% mujeres" no aparece en ese artículo**: quitarlo o buscar otra fuente. | [DPL News](https://dplnews.com/?p=228050) |
| 88% de avanzados prioriza cursos | **Parcial** | "Entre los productores más avanzados, el 88% concentra su oferta en cursos en línea." Fuente Hotmart, sin estudio nombrado ni definición de "avanzado". | [El Financiero](https://www.elfinanciero.com.mx/opinion/colaborador-invitado/2026/06/01/la-economia-de-creadores-se-consolida-como-motor-economico-en-america-latina/) |
| 34% gestiona 3+ productos | **Parcial** | "el 34% administra tres o más productos activos, según datos de Hotmart". La población no se especifica (el doc anterior dice "de los profesionales"; la fuente no lo dice). | misma nota de El Financiero |
| Hotmart ~9,9% de comisión | **Sólida (estructura), montos por país sin verificar** | Estructura: 9,9% + tarifa fija que depende de la moneda; guía comparadora: 9,9% + US$0,50 (>US$15), microtransacciones 20% (<=US$5) y Player US$1,49 por alumno nuevo. Un snippet del centro de ayuda indica que desde el 21-sep-2026 el Player se integra a la tarifa fija y esta sube de 0,50 a 1,00 (no pude abrir el artículo completo: confirmar). | [Guía de Software](https://www.guiadesoftware.com/software/hotmart); [Ayuda Hotmart](https://help.hotmart.com/es/article/208298448/-cuales-son-las-tarifas-cobradas-por-hotmart) |
| Teachable de Hotmart desde 2020 (~US$250 M) | **Parcial** | Lo afirma una guía con afiliados; no verifiqué fuente primaria. | Guía de Software |
| Skool sin white-label ni español | **Sin verificar** | La página de precios no menciona ninguna de las dos cosas. | [Skool](https://www.skool.com/pricing) |

**Qué tratar como sólido en el pitch:** solo "según Hotmart" y con fecha. Para decisión interna, ninguna cifra sustituye las entrevistas.

## 2. Competidores: precio, white-label, pasarelas, app

Precios de las páginas oficiales (USD/mes, facturación anual salvo indicación) leídas el 12-oct-2026. "n/d" = la página no lo dice.

| Plataforma | Precio y comisión | White-label / marca | Pasarelas locales LatAm | App móvil | Notas |
| --- | --- | --- | --- | --- | --- |
| **Hotmart** | Gratis; 9,9% + tarifa fija por moneda | Limitado (checkout en dominio Hotmart, correos con su marca) | Fuerte: +30 métodos locales (OXXO, cuotas, etc.) | App del alumno de Hotmart, sin marca propia | Piso de comparación. Retiene fondos (~30 días según un blog de Sabionet, a confirmar) |
| **Sabionet** | Basic **49** (300 usuarios activos), Pro **79** (1.000), Business **199** (3.000), Enterprise desde **399** (5.000). Anual -20% (39,20 / 63,20 / 159,20). **0% comisión**, solo pasarela | Dominio propio, logo, colores, checkout en todos los planes. **Quitar marca Sabionet: solo Business+** | Mercado Pago nativo, Stripe, PayPal, "Sabionet Payments (Stripe Connect)", efectivo manual; Yape, OXXO, PSE | **Sin app nativa en la web de precios**; su propio blog dice app de marca en plan Gold (inconsistente) | SCORM y certificados en Business. Multi-academia y API no mencionados. Su CEO escribe el blog Bit4learn (fuente interesada). Capterra: alumnos se cargan uno a uno, sin importación masiva (reseña de usuario) |
| **Cursio** | Starter 39, Pro 69; 0% | Dominio y marca | Stripe; Mercado Pago y PayPal "en roadmap" | n/d | Nace en 2024; datos de su propio blog |
| **Wisboo** (Argentina) | Start gratis (límite 10 ventas/3 productos/20 usuarios), Launch 5%, Growth 2%, Business 0%; +1% e-commerce; cuotas mensuales (montos no visibles) | "Sin marca Wisboo", dominio propio desde Launch | Wisboo Pay (cobro local, recibe USD), Mercado Pago, PayPal, Stripe, PayU, OXXO | No mencionada | Fondos directo a tus cuentas |
| **ClassOnLive** | Desde 12 EUR/mes anual; algunos planes con comisión | Sí | Mercado Pago, PayPal, Stripe, PayU Latinoamérica | n/d | Orientada a España (FUNDAE, Verifactu) |
| **Kiwify** | 9,99% + US$0,80, sin mensualidad (Kiwify US, Miami) | No mencionado | No listado en la página | App del alumno | Idioma español no confirmado |
| **Eduzz** | 4,9% (Básico) o 6,9% + R$2,49; pago a 30 días | Escuelas personalizadas (1/3/ilimitadas) | Brasil | App Eduzz | Solo portugués/Brasil en la página |
| **Hubla, Memberkit, Curseduca (ahora WAID)** | Sin datos: hubla.com.br no resolvió, Memberkit 404, Curseduca/WAID sin precios | n/d | n/d | n/d | Mercado brasileño; no hay evidencia de español. Pendiente |
| **Teachable** | Starter 39 (29 anual) con 7,5%; Builder 89 (69); Growth 189 (139); Custom. 0% con Teachable Payments desde Builder | Quitar marca Teachable: Growth | Stripe/PayPal (3,9% + 0,30 internacional) | Apps de alumno | Hotmart la controla |
| **Kajabi** | Basic 179 (143 anual), Growth 249 (199), Pro 499 (399). 0% revenue share; 2%/1%/0,5% si usas proveedor externo | Marca/dominio sí | Kajabi Payments (US), Stripe, PayPal | **Pro incluye app de marca** | 5/50/ilimitados productos; 2.500 contactos en Basic |
| **Thinkific** | Basic 54 (40 anual), Start 109 (82), Grow 219 (164), Plus a medida; 2,9% con Thinkific Payments | White-label (quitar marca): Grow+ | Stripe/PayPal | **App de marca: add-on US$199/mes** | Sin plan gratis desde 2025 |
| **Skool** | Hobby 9 (10%), Pro 99 (2,9%) | No mencionado | n/d | n/d | Ver "sin verificar" arriba |
| **Podia** | Mover 42 (5%), Shaker 84, Earthquaker 150 (0%) | n/d en página | Stripe/PayPal | n/d | |
| **LearnWorlds** | Starter 24 (+US$5 por inscripción pagada), Pro Trainer 79, Learning Center 249 | **White-label completo: Learning Center** | Stripe/PayPal | App de marca: add-on (precio a consultar) | Tiene versión del sitio en español |
| **Uscreen** | Starter 49, Growth 149 (+1,99 por suscriptor), App Essentials 449 (2 apps), Custom | White-label total solo Custom | Stripe/PayPal | **Apps iOS/Android/TV de marca desde 449** | Orientado a video/suscripción |
| **Kartra** | Essentials 59 (5%), Starter 119, Growth 229, Pro 549 | Dominios propios (Growth: 3) | No acepta PayPal para su suscripción; gateways locales n/d | n/d | Todo-en-uno de marketing |
| **Systeme.io** | **Gratis** (1 curso, 2.000 contactos); 17, 47, 97; **0% comisión**; alumnos ilimitados | Dominio propio desde plan gratis | Stripe/PayPal | n/d | Español en la web no confirmado en la página abierta; competidor de precio muy agresivo |
| **Tutor LMS** | Gratis (plugin WordPress); pago desde 199/año (1 sitio), Agency 799/año (sitios ilimitados) | Total (autoalojado) | Muchas pasarelas globales (Stripe, PayPal, Paystack, etc.); ninguna LatAm de la lista visible | Experiencia tipo app (PWA) | Exige WordPress y operación técnica; el creador no lo monta solo |
| **Graphy** | Fuentes en conflicto: ~49 (10%) / ~112-149 (5%) o 0% | App de marca en plan alto, DIY con cuenta Apple propia | n/d | Sí, plan alto | Resultados contradictorios; no usar sin abrir graphy.com |
| **Mighty Networks** | App propia ~US$30.000/año según un competidor | Sí | Stripe | App de marca | Sin verificar (fuente competidora) |

Hallazgos que cambian el doc anterior:
- **Sabionet ya no es "sin dato":** US$49-199/mes, 0% comisión, Mercado Pago nativo. Es el rival directo y su precio es bajo.
- **Quitar la marca Sabionet exige Business (US$199).** White-label real a ese precio es un hueco aprovechable; el plan de entrada no es white-label real.
- Los rivales anglosajones cobran app de marca como extra (Thinkific US$199, Kajabi solo Pro, Uscreen 449, LearnWorlds add-on). Sabionet no la ofrece con claridad.
- **Systeme.io (gratis, 0%) y Hotmart (gratis al entrar)** hacen difícil justificar una cuota fija baja sin diferencial claro.
- Eduzz/Kiwify/Hubla/Memberkit apuntan a Brasil; no hay evidencia de que compitan en español.

## 3. Cobro local por país

Fuentes de tarifas por país: guías con afiliados (Guía de Software, actualizadas sep-2026), no oficiales. Confirmar con cada proveedor.

| País | Medios dominantes | Opciones para integrar | Notas y restricciones |
| --- | --- | --- | --- |
| **Chile** | Webpay (Transbank) 2,95-3,5% + IVA crédito, 1,29-1,8% débito; Flow ~2,95% crédito; Khipu ~0,7-1,5% solo transferencia; Mercado Pago 3,49% + IVA | Flow, Khipu, Webpay (requiere certificación), Mercado Pago, Stripe (según una guía opera desde 2023) | Khipu opera en Chile y Argentina, sin modelo marketplace descrito. Stripe: la guía dice que sí, la página oficial `stripe.com/global` lista solo Brasil y México: **conflicto, confirmar** |
| **México** | Tarjetas, OXXO, SPEI | Stripe (soportado oficialmente), Mercado Pago, Conekta (según guía) | Único país de la lista con Stripe oficial confirmado |
| **Colombia** | PSE, Nequi, tarjetas | Wompi, PayU, ePayco, Mercado Pago | No pude abrir fuentes primarias de PSE/Wompi |
| **Argentina** | Tarjetas en cuotas, Mercado Pago, transferencias | Mercado Pago, Khipu (opera en AR) | Stripe oficial: no listado. Inflación/cepo cambiario no investigados |
| **Perú** | Yape/Plin (~2,99-3,29%), tarjetas ~3,5-4% | Culqi, Izipay, Niubiz, Mercado Pago, PayU; Stripe (guía: desde 2023, no oficial) | Mismo conflicto de Stripe |

### Mercado Pago Connect / Split de Pagos 1:1 (documentación oficial)

- **Qué es:** modelo marketplace. Cada vendedor (el experto) autoriza a Avantia por **OAuth**; Avantia cobra con el `access_token` del vendedor y retiene su comisión por pago (`marketplace_fee` en Checkout Pro, `application_fee` en Checkout API). Reparto automático.
- **Disponibilidad:** Argentina, Brasil, Chile, Colombia, México, Perú y Uruguay (cubre los 5 países objetivo).
- **Orden de descuentos:** primero la comisión de Mercado Pago al vendedor, luego la de la plataforma sobre el resto.
- **Requisitos:** cuenta de vendedor con **KYC nivel 6**; app de Mercado Pago; credenciales de integrador; cuentas de prueba.
- **Restricciones:** solo modelo **1:1** (el 1:N es solo para cartera asesorada con ejecutivo comercial). Cambiar la fecha de liberación de la comisión requiere ejecutivo. Reembolsos se descuentan proporcionalmente a ambas cuentas y dependen de que el vendedor tenga saldo. La página dice que solo se admiten pagos "con dinero en cuenta de Mercado Pago" y no transferencias externas, pero su ejemplo usa un token de tarjeta: **ambiguo, hay que probarlo en sandbox antes de prometer cobro con tarjeta y efectivo**. No documenta topes de comisión ni suscripciones/recurrentes dentro de este modelo (verificar).
- **Fondos:** van al vendedor, no a Avantia (ventaja: Avantia no retiene dinero ni necesita licencia de transmisor).

### Stripe Connect

- Plataformas con pagos cruzados auto-servicio: solo con plataforma en EE. UU., Reino Unido, EEE, Canadá o Suiza. Cuentas conectadas LatAm fuera de esas regiones requieren Global Payouts (EE. UU./Reino Unido) o contacto con ventas.
- Stripe como procesador en el país del experto: oficial en México (y Brasil). Chile/Perú/Colombia/Argentina: sin confirmación oficial.
- Conclusión: Stripe no resuelve la base LatAm; Mercado Pago Connect sí cubre los cinco países. Flow/Khipu/Webpay son complementos locales sin modelo marketplace documentado (hay que preguntarles por cobro a terceros).

## 4. Diferencial real para Avantia

**Lo que ya no es diferencial:** "marca propia + dominio + Mercado Pago + español + 0% comisión". Sabionet lo hace desde US$49/mes (solo la marca Sabionet se oculta en US$199). Cursio y Wisboo van por ahí. Hotmart ofrece el cobro local.

**Lo que probablemente sigue abierto:**
1. **Retención medida por tenant** (cohortes, alertas de abandono, práctica de recuperación). Ninguna ficha revisada lo vende como producto. Hipótesis a validar, no hecho.
2. **Multi-tenant para agencias** con panel central: Sabionet no lo menciona (no confirmado, preguntarles). Teachfloor/Fayne están en inglés.
3. **White-label real y app de marca incluida** a un precio por debajo de Thinkific/Kajabi/LearnWorlds/Uscreen y con claridad que Sabionet no da.
4. **Cobro con split vía Mercado Pago Connect**: el experto cobra directo en su cuenta; Avantia no custodia fondos. Sabionet usa MP con las cuentas del cliente (modelo distinto a marketplace).

**Riesgos:**
- Hotmart gratis al entrar + Systeme.io gratis: la disposición a pagar cuota fija puede ser baja para el experto pequeño (el 74% de la base).
- Sabionet puede replicar retención o agencias; tiene ventaja de cuota y producto.
- Dependencia de Mercado Pago (KYC 6 del experto, ambigüedad de medios, 1:N cerrado).
- Todas las cifras de demanda son de Hotmart.

## 5. Ajustes a las guías de entrevista

1. **Preguntar por Sabionet, Wisboo, Cursio, Systeme.io y Tutor LMS por nombre** (Guía A, sección 2, pregunta 3 y sección 7). Hoy solo hay genéricos.
2. **Medir la barrera "gratis al entrar":** añadir "si hoy pagas solo por comisión, ¿qué porcentaje de tus ingresos se va en comisión?" y "¿a partir de cuánto vendido al mes una cuota fija te convendría?" (la fuente de Sabionet sugiere punto de cruce entre US$500 y US$1.000 de ventas mensuales; validar con datos reales).
3. **Marca real:** distinguir "dominio propio" de "sin ningún logo de la plataforma". Preguntar si lo han visto y si paga la diferencia (Sabionet lo cobra desde US$199).
4. **App móvil:** añadir pregunta de conducta ("¿tus alumnos piden app o ven el curso desde el navegador?") antes de invertir; el 78% móvil es de 2023 y no implica app nativa.
5. **Cobro:** preguntar país del experto, si tiene cuenta de Mercado Pago (verificada) y qué medios usan sus alumnos (efectivo/OXXO/PSE/Yape). Probar con 2-3 expertos si aceptan conectar su cuenta por OAuth.
6. **Retención:** ya está en la guía; añadir "¿quién ve esos datos hoy?" para validar que sea un dolor y no un nice-to-have.
7. **Guía B:** preguntar si usan multi-cuenta en Sabionet/Hotmart y qué les falta (panel central, facturación por cliente).
8. **Criterios de descarte:** agregar "si los expertos pequeños ya usan Systeme.io o la capa gratuita de Hotmart y no pagan por ninguna función de retención, replantear a agencias o ticket alto".
9. **Corregir el doc original:** quitar "Grand View Research", quitar "60% mujeres", fechar el 78% (2023) y registrar los precios de Sabionet.

## Fuentes principales

- [Mexico Business](https://mexicobusiness.news/talent/news/professionalizing-creator-economy-scale-businesses), [DPL News 74%](https://dplnews.com/?p=320784), [Semana](https://www.semana.com/economia/macroeconomia/articulo/colombia-lidera-la-economia-de-creadores-en-la-region/202612/), [El Financiero](https://www.elfinanciero.com.mx/opinion/colaborador-invitado/2026/06/01/la-economia-de-creadores-se-consolida-como-motor-economico-en-america-latina/), [DPL News Hotmart Insights 2023](https://dplnews.com/?p=228050)
- Precios oficiales: [Kajabi](https://www.kajabi.com/pricing), [Teachable](https://www.teachable.com/pricing), [Thinkific](https://www.thinkific.com/pricing/), [Skool](https://www.skool.com/pricing), [Sabionet](https://sabionet.com/planes-y-precios), [Podia](https://www.podia.com/pricing), [LearnWorlds](https://www.learnworlds.com/pricing/), [Uscreen](https://www.uscreen.tv/pricing/), [Kartra](https://www.kartra.com/pricing), [Systeme.io](https://systeme.io/pricing), [Tutor LMS](https://tutorlms.com/pricing/), [Wisboo](https://wisboo.com), [Kiwify](https://kiwify.com/), [Eduzz](https://www.eduzz.com/taxas)
- Comparativas interesadas: [Bit4learn (CEO de Sabionet)](https://bit4learn.com/sabionet-vs-hotmart/?amp=1), [Cursio](https://cursio.app/blog/mejores-plataformas-cursos-online-espanol-2026), [ClassOnLive](https://www.classonlive.com/blog/mejor-plataforma-crear-cursos-online), [Guía de Software Hotmart](https://www.guiadesoftware.com/software/hotmart), [Chile](https://www.guiadesoftware.com/blog/mejor-pasarela-pago-chile), [Perú](https://www.guiadesoftware.com/blog/mejor-pasarela-pago-peru)
- Pagos: [Mercado Pago Split 1:1](https://www.mercadopago.com.mx/developers/es/docs/split-payments/split-1-1/landing), [integración marketplace](https://www.mercadopago.com.mx/developers/es/docs/split-payments/split-1-1/integration-configuration/integrate-marketplace), [requisitos previos](https://www.mercadopago.com.mx/developers/es/docs/split-payments/split-1-1/prerequisites), [Stripe cross-border payouts](https://docs.stripe.com/connect/cross-border-payouts), [Stripe global](https://stripe.com/global), [Khipu](https://khipu.com)

**Pendiente de verificar:** tarifa fija de Hotmart por país, precios de Hubla/Memberkit/Curseduca-WAID/Graphy, Stripe en Chile/Perú/Colombia/Argentina, Flow/Webpay oficial y su soporte para cobro a terceros, PSE/Wompi/Nequi, recurrencia dentro de Split de Mercado Pago, y si Sabionet ofrece multi-academia.
