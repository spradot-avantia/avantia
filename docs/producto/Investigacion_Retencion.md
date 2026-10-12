# Investigación de retención: verificación de la evidencia inicial (2026-10-12)

Verifica `Retencion_Evidencia_Inicial.md` contra fuentes primarias o lo más cercano posible. Limitación de método: varias fuentes se leyeron solo vía resumen/abstract (algunos PDF no se pudieron extraer); lo no leído en texto completo se marca "(sin texto completo)". Estados: confirmada / matizada / no encontrada / contradicha.

## 1. Tabla de verificación

| # | Afirmación | Estado | Qué dice la fuente | Diseño / tamaño | Fuente |
|---|---|---|---|---|---|
| 1 | Calendario fijo 45% vs 13% autoguiado (MOOC programación, ~8.000) | **Confirmada con matiz** | Cifras 45% vs 13% atribuidas a un paper de FIE 2020 que compara dos ediciones. Los autores atribuyen la brecha sobre todo a inicios distintos (inversión inicial de tiempo), no al calendario en sí. Un estudio posterior con 5 ediciones Python/Java encuentra mejor tasa de aprobación y progreso más rápido en las programadas, pero mayor asistencia inicial en las no programadas, y una edición no programada reciente con mejores notas. Los autores sugieren combinar ambos formatos. | Comparación de dos ediciones (no aleatorizada, "cuasi-experimental" no verificado); >8.000 estudiantes. Segundo estudio: 5 ediciones, sin n en el abstract. | FIE 2020, "Deadlines and MOOCs" ([IEEE](https://computer.org/csdl/proceedings-article/fie/2020/09274023/1phRTHwOS7C), autoría no verificada); Erkki y Lemström 2023, Informatics in Education ([link](https://www.infedu.vu.lt/journal/INFEDU/article/760)) |
| 2a | Práctica de recuperación g = 0.67 en aula | **Contradicha (cifra)** | El meta-análisis de aula de Yang et al. 2021 reporta g = 0.499 (medio). No se halló 0.67 en ninguna fuente. Otros meta-análisis más antiguos dan rangos 0.5-0.6 (de memoria, no verificado). El efecto depende del control (quiz vs reestudio ~0.33, dato de blog secundario) y de feedback correctivo. | 222 estudios de aula, 48.478 estudiantes | Yang, Luo, Vadillo, Yu, Shanks (2021), Psychological Bulletin 147(4), doi 10.1037/bul0000309 ([resumen](https://scholars.hkbu.edu.hk/en/publications/testing-quizzing-boosts-classroom-learning-a-systematic-and-meta-/)) |
| 2b | Espaciada > masiva, g = 0.74 | **Confirmada** (para práctica de recuperación) | Latimier, Peyre y Ramus (2021): beneficio fuerte de recuperación espaciada vs masiva, g = 0.74. | 29 estudios, 39 tamaños de efecto. Mayoría en laboratorio/estudiantes; no es MOOC. Meta-análisis de aula de 2025 da d = 0.54 (menor). | Latimier et al. 2021 ([abstract vía índice](https://ifp.nyu.edu/?p=1511228)); 2025 aula ([PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC12189222/)) |
| 2c | Sin ventaja de intervalos expansivos | **Confirmada (secundaria)** | Expansivos vs uniformes: g ≈ 0.034 según resumen secundario; no verificado en el paper. | Subconjunto del mismo meta-análisis | Idem |
| 3 | Presencia social: satisfacción predice persistencia, presencia no directamente; visitas al foro no mejoran notas y decaen tras semana 1 | **No encontrada / parcialmente contradicha** | No hallé el estudio que respalde "visitas al foro no mejoraron notas y decayeron". Evidencia RCT contraria: empujar al azar a visitar el foro subió interacción social, quizzes y notas (hasta +4,3% de completar el quiz siguiente por visita), y discusiones por pares reales +10% en quizzes. Otro campo con 1.101 alumnos de edX: sistemas de reputación sin efecto en notas ni retención. Posible origen: Mehta et al. (L@S 2025, doi 10.1145/3698205.3733930), PDF no extraíble, **sin verificar**. | Zhang, Allon, Van Mieghem: >30.000 alumnos, 2 experimentos aleatorios, MOOC gratuito | [MSOM](https://pubsonline.informs.org/doi/fpi/10.1287/msom.2016.0615); [Mehta PDF](https://learninganalytics.upenn.edu/ryanbaker/Learning@Scale_final_Final_Mehta.pdf) |
| 4 | Motivación: revisión de 50 estudios, motivos académicos = factor más importante | **No verificada** | No se buscó la revisión específica; queda pendiente localizarla. | n/a | n/a |
| 5a | Normas descriptivas (% de pares que completó) mejoran la entrega | **Confirmada** | Mensajes con la tasa de finalización de pares elevaron la probabilidad de entregar y acortaron el tiempo. | RCT de campo en MOOC chino; una sola plataforma, MOOC gratuito | Huang, Zhang, Burtch, Li, Chen, "Combating Procrastination on MOOCs via Optimal Calls to Action", ISRE ([link](https://pubsonline.informs.org/doi/fpi/10.1287/isre.2020.0974); [HEC WP](https://hal-hec.archives-ouvertes.fr/hal-02985743)) |
| 5b | Recordatorios de fecha contraproducentes con carga baja | **Confirmada** | Recordatorio de fecha límite tuvo efecto contraproducente, concentrado en usuarios con poca carga activa (el plazo parece lejano). | Idem | Idem |
| 5c | Prompts de planificación sin efecto general | **No encontrada** | Existe un RCT (Andor et al., openHPI/openSAP, 2016-17) pero solo hallé el registro, sin resultados. | RCT preregistrado | [AEA RCT 1780](https://www.socialscienceregistry.org/trials/1780) |
| 6a | Video corto: 6,9 M de sesiones | **Confirmada** | Guo, Kim, Rubin (2014): 6,9 M de sesiones, 4 cursos edX. Videos más cortos más atractivos; talking-head informal y tableta estilo Khan rinden mejor que clases grabadas. Engagement cae sobre todo pasados ~6 min (según resumen de UBC; cifra exacta sin texto completo). | Observacional, 4 cursos edX, métrica = tiempo de visionado e intento de problemas posteriores | Learning@Scale 2014 ([PDF](https://www.cs.rochester.edu/hci/pubs/pdfs/edX-MOOC-video-production-and-engagement_LAS-2014.pdf); [resumen UBC](https://blogs.ubc.ca/videolearninghub/?p=569)) |
| 6b | Dividir videos = +10% visionado | **No encontrada** | Ningún resumen menciona ese porcentaje. Además es correlacional: video corto no implica más aprendizaje. | n/a | n/a |
| 7 | Gamificación g = 0.82 | **Matizada** | Existe: meta-análisis 2023, g = 0.822, IC 95% 0.567-1.078 (impreciso). Otros meta-análisis dan 0.46-0.50 (g = 0.49 cognitivo en 2020). Es resultado de aprendizaje, no de retención. | 41 estudios, 49 muestras, ~5.000 participantes | [PMC10591086](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10591086/); Bai et al. 2020 ([ref](https://www.gbl.uzh.ch/quartz/references/Bai-et-al.-(2020))) |
| 8 | Adaptatividad mejora aprendizaje en MOOC de Microsoft sin gran efecto en abandono | **Confirmada** | Evaluación adaptativa con énfasis en remediación elevó las ganancias de aprendizaje, con poco efecto en abandono. Una tesis de Utrecht halló menos abandono pero menor satisfacción (evidencia débil). | RCT con 3 grupos en MOOC autoguiado de Microsoft en edX | Rosen et al., L@S 2018, doi 10.1145/3231644.3231651 ([link](https://www.vpal.harvard.edu/resource/effectsofadaptivelearningpdf)) |

## 2. Cohortes vs autoguiado en cursos pagos de creadores

Hay muy poca evidencia independiente. Lo mejor es observacional y de proveedor:

- **Ruzuku** (plataforma de cursos para creadores; autor es su CEO). 27.156 cursos, 1,3 M inscripciones, precios $10-$10.000. Finalización registrada: cohorte programada 53,4%, goteo a demanda 42,9%, autoguiado abierto 41,9%. Brecha de 11,5 puntos. Varía por nicho (coaching 77% vs 38,5%; espiritualidad lo contrario, 25,6% vs 48,7%). Observacional, sin causalidad, sin aislar sesiones en vivo. [Link](https://www.ruzuku.com/learn/articles/cohort-vs-self-paced-completion-study). Otra versión anterior de Ruzuku hablaba de 64,2% vs 48,2% y 81,4% en cohortes de 26-50; las cifras cambian entre versiones, lo que resta confianza.
- **Marketing de cohortes** (Disco y similares): "85-95% vs 3-15%". Sin metodología; compara cohortes pagas y seleccionadas con MOOCs gratuitos. No usar como dato.
- **Coursera, pagos vs gratis** (estudio revisado por pares de ~70 cursos, 2012-2016): pagar el certificado se asocia a mucha más finalización; los autores estiman un efecto causal de 10-12% de engagement por querer/pagar el certificado, pero hay sesgo de selección. Un estudio del MIT (IRRODL 2020) con cupones de certificado gratis sugiere que el compromiso va más allá del precio. [UMich](https://record.umich.edu/articles/research-shows-certificates-boost-mooc-completion-rates); [IRRODL](https://irrodl.org/index.php/irrodl/article/view/4564).
- **Udemy**: sin datos primarios; blogs citan 5-22%. No verificado.

### Tasas típicas y brecha MOOC gratuito vs curso pago

| Contexto | Finalización típica | Calidad del dato |
|---|---|---|
| MOOC gratuito | ~3-13% (mediana ~12,6% según Class Central; MIT: ~3% en 2018) | Razonable, pero la definición de "inscrito" incluye curiosos |
| Curso pago autoguiado de creador | ~40-45% (Ruzuku, completar todos los módulos), alta dispersión | Un proveedor, observacional |
| Curso pago en cohorte | ~53% promedio, 70-80% en nichos (coaching) | Un proveedor, observacional |
| Marketplace (Udemy) | 5-22% | Blogs sin fuente |

Lectura: la mayor parte de la brecha MOOC vs pago viene de selección y de la inversión económica (los inscritos gratis no tienen intención de terminar), no del formato. La ventaja de la cohorte sobre el autoguiado pago es real en los datos disponibles pero modesta (~10 puntos en promedio) y heterogénea por nicho. Los resultados de MOOC gratuitos (45% vs 13%, nudges, foros) se pueden transferir solo en dirección, no en magnitud. Además "finalización" mide terminar lecciones, no aprendizaje ni resultados del alumno.

## 3. Conclusiones

1. **Cadencia/cohorte sigue en el Pareto, pero con efecto más chico y mecanismo distinto.** El 45% vs 13% se debe sobre todo al arranque conjunto, y en un caso el formato autoguiado tuvo mejores notas. En cursos pagos la ventaja esperable es ~10 puntos, muy variable. Hay que diseñarlo como opción (cohorte vs goteo vs abierto) y medirlo, no imponerlo.
2. **Práctica de recuperación:** se corrige a g ≈ 0.5 (no 0.67); espaciada vs masiva g ≈ 0.74 en laboratorio, ~0.5 en aula. Sigue siendo la palanca de **aprendizaje** mejor respaldada, pero no hay evidencia de que reduzca abandono. Intervalos simples bastan.
3. **Presencia del creador:** la cita sobre foros no se verificó y un RCT grande muestra lo contrario (empujar a participar mejora resultados). Pasa de "afirmación sólida" a "plausible, medir". Ojo: no hay prueba de que la presencia directa aumente persistencia.
4. **Nudges:** las normas descriptivas y la contraproducencia del recordatorio de fecha están respaldadas, pero en un solo RCT en un MOOC chino gratuito. Los recordatorios genéricos no deben ser el default; probar normas con cuidado de no mostrar tasas bajas (ver riesgos).
5. **Video corto:** la correlación (más corto, más visionado, 6,9 M sesiones) es sólida; el "+10%" no existe en la fuente consultada. Barato de recomendar, pero no es palanca de retención demostrada.
6. **Gamificación:** subir a g = 0.82 es engañoso; el rango honesto es 0.45-0.82 en aprendizaje, nada en retención de creadores. Mantener pospuesta.
7. **Adaptatividad:** ayuda al aprendizaje y no al abandono; pospuesta es correcto.
8. **Hallazgo nuevo más importante:** un dato de pago (Coursera, cupones del MIT) apunta a que el **compromiso económico y la intención** pesan más que cualquier palanca de producto. Esto sube de rango la captura de intención al inicio y el onboarding.

## 4. Pareto corregido para el MVP (5 palancas)

1. **Cadencia configurable por curso** (cohorte con inicio común, goteo, abierto) con arranque conjunto. Es la palanca con más respaldo directo, aunque con efecto moderado y a medir por tenant.
2. **Onboarding con captura de intención y primera victoria rápida** (objetivo, tiempo disponible, primera lección en la primera sesión). Respaldado por el efecto de la inversión inicial (#1), los abandonos concentrados al inicio y la revisión de motivación (pendiente de verificar).
3. **Práctica de recuperación con feedback correctivo y repaso espaciado simple** (quiz corto post-lección, repaso a intervalos fijos). Para aprendizaje percibido y real, no para abandono.
4. **Mensajería de nudge con normas descriptivas** (por email/WhatsApp), sin recordatorio genérico de fecha, y con segmentación por carga del alumno.
5. **Presencia del creador de bajo costo** (respuesta a dudas con tiempo objetivo, mensajes de bienvenida/cierre en video corto), tratada como hipótesis a medir, más guía de lecciones cortas (< 6-9 min) como práctica por defecto.

Cambios vs. el original: se agrega onboarding/intención (antes solo una nota), se baja presencia y video de "evidencia" a "hipótesis", y se explicita que el efecto de cadencia es mediado por el arranque.

## 5. Qué instrumentar por tenant

**Eventos mínimos:** inscripción (con precio y origen), intención declarada, primera sesión, lección iniciada/completada, % de video visto y puntos de abandono, intento de quiz y acierto, repaso espaciado abierto, mensaje enviado/abierto/clic, pregunta al creador y tiempo de respuesta, pago/reembolso.

**Métricas:** activación (primera lección completada en 48 h), retención semanal W1/W2/W4 por cohorte de inscripción, finalización a 30/60/90 días, tiempo hasta primera lección, latencia entre sesiones, retención de conocimiento (acierto en repaso a 7 y 30 días), reembolso, NPS/satisfacción por módulo. Reportar siempre por formato (cohorte/goteo/abierto) y precio, y con tamaños de muestra, porque los tenants serán pequeños.

**Hipótesis A/B concretas** (cada una exige poder estadístico; con tenants chicos, agrupar entre tenants cuando sea posible):

- H1: Inicio de cohorte común vs acceso inmediato con goteo aumenta finalización a 60 días en ≥ 10 puntos.
- H2: Mensaje de bienvenida con captura de objetivo aumenta activación 48 h en ≥ 5 puntos.
- H3: Nudge con norma descriptiva ("X% de tu grupo ya hizo la lección 2") vs sin nudge aumenta lecciones/semana; vs recordatorio de fecha, no es peor.
- H4: Quiz de recuperación de 3 preguntas al final de lección vs sin quiz mejora acierto a 7 días sin bajar finalización.
- H5: Repaso espaciado en días 2, 7, 21 vs repaso único mejora acierto a 30 días.
- H6: Respuesta del creador en < 24 h vs sin compromiso de tiempo mejora W4.
- H7 (secundaria): lecciones divididas en bloques de 6 min vs lecciones largas cambian % visto y abandono por lección (diseño con el mismo contenido).

## 6. Riesgos y límites

- La mayoría de las fuentes son MOOC gratuitos, de universidad, en inglés o chino; la transferencia a cursos pagos LatAm en español no está probada.
- Las cifras de cursos pagos (Ruzuku) son de un proveedor con interés comercial, observacionales y con inconsistencias entre versiones.
- Normas descriptivas pueden desmotivar si el porcentaje es bajo; no hay evidencia sobre ese riesgo, solo la lógica general.
- Pendientes de verificación en texto completo: umbral exacto de 6 min y mediana de Guo et al.; autoría del paper FIE 2020; g = 0.034 de expansivos; Mehta et al. 2025; la "revisión de 50 estudios" de motivación; el RCT de planificación de Andor et al.; el origen del 0.67 y del +10%.
- "Finalización" no equivale a aprendizaje ni a resultados de negocio del experto; la métrica de éxito debe incluir ambos.
