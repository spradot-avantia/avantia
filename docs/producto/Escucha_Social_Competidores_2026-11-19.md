# Escucha social: por qué un experto querría dejar su plataforma actual

**Fecha:** 2026-11-19 · **Para:** el equipo (deck, buyer persona y guion de entrevistas).
**Pregunta:** ¿qué dicen en público los expertos que venden cursos en Hotmart, Udemy, Domestika, Teachable, Kajabi o Thinkific cuando se quejan o se van? ¿Qué perfil de "Avanter" querría migrar?

**Estados:** *verificado* = leído en la fuente · *parcial* = testimonio individual o fuente interesada · *hipótesis* = inferencia nuestra.

## Límites de esta búsqueda (leer primero)

- Se buscó en la web abierta: Reclame Aqui, Trustpilot, Capterra, OCU, prensa (Class Central, El Español) y blogs comparadores.
- **Reddit, Instagram, TikTok, X y los grupos de Facebook no salieron en el buscador.** Quedan como búsqueda manual del equipo (guion en §5).
- Los testimonios son **individuales y unilaterales**. Sirven para encontrar patrones y frases, no para medir frecuencias.
- Varias fuentes son competidores que hablan mal del rival (Ruzuku, EzyCourse) o blogs con afiliados. Se marcan así.
- No hay nombres ni usuarios personales en este documento: solo el perfil y el enlace a la fuente pública.

## 1. Lo que encontramos, por dolor

### A. Plata retenida y bloqueos sin explicación (Hotmart)
El patrón más repetido en Reclame Aqui: la cuenta queda bloqueada o el saldo retenido de 30 a 180 días, el soporte da respuestas genéricas ("violaciones a los Términos de Uso") y el área que bloquea no es la que responde.

| Perfil | Lo que dice | Etiqueta | Fuente |
|---|---|---|---|
| Productor "Black" (~200 mil ventas) | Bloqueo de cuenta que atribuye a una falla de seguridad de la plataforma | Dolor · disparador | [Reclame Aqui](https://www.reclameaqui.com.br/hotmart/bloqueio-injusto-de-conta-produtor-black-200-mil-vendas-falha-de-seguranca-da-plataforma_jz1yChZ5hqbmR4hT/) |
| Productor | Saldo retenido 180 días, "3 justificativas contraditórias", soporte "negligente" | Dolor | [Reclame Aqui](https://www.reclameaqui.com.br/hotmart/hotmart-bloqueia-conta-retem-saque-por-180-dias-apresenta-3-justificativas-contraditorias-e-tem-um-suporte-negligente-sem-transparencia-alguma_VXkPEznKU7ZTwrXk/) |
| Productor | Saldo bloqueado 7 meses sin justificación clara | Dolor | [Reclame Aqui](https://www.reclameaqui.com.br/hotmart/hotmart-bloqueia-saldo-de-produtor-de-conteudo-ha-7-meses-sem-justificativa-clara_xzlklfxYC6zGN_sM/) |
| Productor | Mes de R$6.000 con ~R$2.000 en tarifas, y además retención del retiro | Dolor · gasto real | [Reclame Aqui](https://www.reclameaqui.com.br/hotmart/bloqueio-de-saldo-e-taxas-abusivas-na-hotmart_S_5eJSULN7JoC3bw/) |

Estado: parcial (testimonios). **Lectura para Avantia:** el dolor no es solo la comisión, es **no controlar el propio dinero ni la propia relación con el alumno**. El diseño del ADR 020 (Mercado Pago Connect: la academia conecta su propia cuenta y el dinero no pasa por Avantia) responde directo a este dolor. **Pero la integración está en pausa:** en el deck va como roadmap, nunca como hecho (regla del Mapa de afirmaciones).

### B. La comisión y la letra chica
- Hotmart: 9,9 % + tarifa fija por venta. La parte fija habría subido de R$1 a R$2,49 el 21-sep-2026 (≈ +40 % de costo en un curso de R$27). Estado: parcial ([HeroSpark](https://herospark.com/guias/taxas-e-margem)).
- Si se suman plataforma, afiliado, player y retiro, el productor puede quedarse con menos del 50 % del precio bruto (blog con afiliados, [Bit4learn](https://bit4learn.com/hotmart/)). Estado: parcial.
- Teachable Starter: 7,5 % por transacción; con US$5.000 al mes son ~US$375 en tarifas. Estado: parcial (comparador).
- **El comprador queda como cliente de Hotmart, no del productor** (datos, correo, historial). Estado: parcial ([Kursopro](https://kursopro.com/blog/emprendimiento/estafa-hotmart/)).

### C. El marketplace cambia las reglas y baja lo que paga (Udemy, Domestika)
- **Udemy** bajó la parte del instructor en suscripciones de 25 % a 20 % (2024), 17,5 % (2025) y 15 % (2026). La venta orgánica sigue en 37 %, y el programa de ofertas vende cursos a US$9,99 sin importar el precio original. Estado: **verificado** en el reportaje de [Class Central](https://www.classcentral.com/report/udemy-broken-promise-instructor-payouts/); la tasa de 2026 la repiten blogs.
- **Domestika** pasó a muchos profesores de un pago fijo a un adelanto de comisión (2023, [El Español](https://www.elespanol.com/reportajes/20230602/caida-domestika-millones-despedir-sustituir-tareas-chatgpt/768173529_0.amp.html)). Hay reseñas de 2024 de docentes que reclaman una caída abrupta de comisiones ([Trustpilot](https://es.trustpilot.com/review/domestika.org?page=3), 1,7/5). Estado: parcial.

**Lectura:** este es exactamente el perfil del ejemplo de Samuel: *compite contra muchos que enseñan lo mismo, a US$9,99, en una vitrina que no controla*. El marketplace le trae alumnos, pero baratos y sin relación.

### D. Saturación: competir con muchos que enseñan lo mismo
- El propio blog de Hotmart reconoce que la pregunta "¿no está saturado el mercado?" es frecuente, que el tráfico pagado es más caro y que el alcance orgánico bajó. Recomienda diferenciarse por subnicho ([Hotmart](https://hotmart.com/pt-br/blog/mercado-saturado)). Estado: parcial (fuente interesada que lo minimiza).
- La IA acelera la saturación: más cursos genéricos, hechos más rápido. Estado: hipótesis.

### E. Alumnos que no terminan
- No apareció como queja principal en las reseñas de plataformas. Coincide con el estudio de Ruzuku (118 quejas públicas: soporte 35, precio 34, fallas 21, encierro en la plataforma 14, funciones 12; el seguimiento del progreso no está entre las principales; ver `Investigacion_Evaluacion_y_Visibilidad_Docente_2026-11-15.md` §7.1).
- Donde sí aparece es en el discurso de los creadores sobre su propio negocio: "nadie termina", "compran y no entran" (newsletters y podcasts; sin cita fuerte todavía).

**Lectura (importante para el pitch):** la baja finalización es un **dolor latente**. El experto no se lo reclama a la plataforma porque no cree que sea problema de ella. Para que funcione en el deck, hay que conectarlo con un dolor declarado: *si no terminan, no te recomiendan ni te vuelven a comprar* → cuesta más conseguir alumnos nuevos (D). Validar en entrevistas.

### F. Precio que sube y migraciones dolorosas (Teachable, Kajabi, Thinkific)
- Un creador migró a Teachable en 2020 con un plan anual de US$348; luego el precio subió y perdió la posibilidad de crear cursos nuevos, así que se fue a LearnWorlds y se quejó de que no tuvo tiempo para migrar su biblioteca y alumnos ([Trustpilot](https://pl.trustpilot.com/review/teachable.com)). Etiqueta: disparador de cambio · gasto real. Estado: parcial.
- Kajabi retiró el plan Kickstarter y subió precios en ene-2026 (Basic US$179/mes). Thinkific subió ~10 % el 13-ago-2026. Estado: parcial.
- Un reseñador de Capterra se fue de Kajabi a Teachable "porque Kajabi es demasiado caro" ([Capterra](https://capterra.com/p/147019/Teachable/reviews/?page=6)).

**Lectura:** las subidas de precio son **disparadores de cambio** reales. El miedo a migrar (perder alumnos y contenido) es la barrera. Avantia necesita un "te migramos tus alumnos y cursos" en el programa fundador.

## 2. Proto-personas (hipótesis, sin entrevistas)

Las tres encajan como subsegmentos del "experto con programa acompañado" de `presentaciones/v3/brief/02_Buyer_persona.md`, excepto la B, que es un segmento de entrada más masivo.

**A. "Pily", coach que vende en Hotmart (la del ejemplo).**
Coach o consultora con 1–3 cursos en Hotmart, de US$50–300, y una comunidad en Instagram o WhatsApp.
- Paga 9,9 % + tarifa fija, a veces más con afiliados.
- Le retuvieron plata alguna vez o teme que le pase.
- Sus alumnos compran y no terminan; no sabe quién entendió.
- No consigue alumnos nuevos sin pagar anuncios, porque compite con cientos que venden lo mismo.

Disparador: una retención de saldo, la subida de la tarifa fija o un lanzamiento que vende menos que el anterior. **Qué le ofrecemos:** su marca y su dominio, sin comisión por venta (el cobro directo a su cuenta es roadmap) y saber quién domina qué para mejorar los resultados y los testimonios.

**B. "Franco", instructor de marketplace (Udemy o Domestika).**
Profesional técnico (diseño, Excel, programación) con un curso de muchas reseñas en Udemy o Domestika.
- Ve caer lo que le pagan (de 25 % a 15 % en suscripciones).
- Los alumnos no son suyos: no tiene sus correos.

Disparador: el aviso de un nuevo recorte. **Qué le ofrecemos:** un canal propio para su versión "premium" o acompañada, a un precio más alto. **Riesgo:** su modelo es volumen barato, no acompañamiento, así que puede no ser cliente del MVP. Validar.

**C. "Carla", experta en vivo que ya se fue de una plataforma.**
Da programas en vivo con Zoom, WhatsApp y Drive, y probó Teachable o Kajabi pero le resultó caro o en inglés.
- Hoy usa todo por separado (es el cliente principal del brief 02).

Disparador: el próximo grupo o edición. **Qué le ofrecemos:** todo en un lugar, en español, con práctica y seguimiento.

## 3. Qué cambia en el deck
- Slide 4/5 (dolores del Avanter): agregar **"no controla su plata ni sus alumnos"** (A, B y C) y **"compite en una vitrina saturada"** (D). Son dolores **declarados**. "No sabe quién entendió" es el dolor **latente** que Avantia resuelve y que se valida en entrevistas.
- Slide 23 (competencia real): sumar a Udemy y Domestika como "marketplaces que bajan lo que pagan". Cifra citable: Udemy 25 % → 15 % en suscripciones (Class Central).
- No decir que los demás no tienen analítica (regla del Mapa de afirmaciones, 15-nov).

## 4. Qué llevar a las entrevistas (`Mercado_Segmento_Expertos_Entrevistas.md`)
- "¿Alguna vez te retuvieron un pago o te bloquearon una cuenta? ¿Qué hiciste?" (conducta pasada)
- "¿Cuánto pagaste el mes pasado en comisiones y herramientas? ¿Lo tienes anotado?" (gasto real)
- "¿Te has cambiado de plataforma? ¿Qué lo gatilló y qué fue lo más difícil de migrar?" (disparador y barrera)
- "¿Sabes cuántos de tus alumnos del último grupo terminaron? ¿Cómo lo sabes?" (¿es latente o declarado?)
- Probar el término **Avanter**: "¿Te sentirías identificado con este nombre?" (ver `Glosario_Avantia.md`)

## 5. Búsqueda manual pendiente (equipo, ~2 h)
Buscar en Instagram, TikTok, X, YouTube (comentarios) y grupos de Facebook de infoproductores, en español y portugués:
- "Hotmart me bloqueó", "Hotmart retuvo mi dinero", "dejé Hotmart", "alternativa a Hotmart", "comisión Hotmart"
- "mis alumnos no terminan el curso", "nadie termina mi curso", "cómo hacer que terminen mi curso"
- "Udemy paga menos", "Domestika profesor pago", "me fui de Udemy"
- "migrar de Teachable", "Kajabi muy caro"

Para cada hallazgo: captura, enlace, fecha, perfil (sin nombre) y etiqueta (dolor / solución actual / gasto real / disparador). Los perfiles que coincidan con A o C son **candidatos a entrevista**: contactarlos por mensaje directo, con consentimiento, no en público.
