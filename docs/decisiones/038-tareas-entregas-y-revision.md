# 038 — Tareas, entregas y revisión del creador

- **Fecha:** 2026-11-08
- **Estado:** Aceptada (Samuel aprobó el 2026-11-08). Migración `0020` aplicada en **dev** el 2026-11-08; producción solo cuando Samuel lo pida

## Contexto

Samuel dicta una clase en vivo de Inferencia Estadística (material en LaTeX, Google Meet) y quiere apoyarse en Avantia, al estilo de Canvas pero más estructurado. Ya existen materiales con archivo (ADR 030), lecciones de video y texto, y quiz automático por módulo (ADR 022 y 023). Falta lo que más pesa en un curso con acompañamiento: que el alumno **entregue ejercicios resueltos** (archivo) y que el creador los **revise, califique y comente**. Esto amplía el alcance del MVP: las decisiones de producto vigentes dejan las lecciones en «video + texto» y el quiz de alternativas como única evaluación. El cambio se anota en `docs/producto/` al aprobar.

## Decisión (recomendada)

**Tarea** como actividad dentro de una lección (tipo de contenido adicional, no un módulo aparte), con entrega de archivo y revisión.

Modelo de datos (toda tabla con `tenant_id`, RLS por tenant, índice compuesto que empieza por `tenant_id`):

- `tareas`: `id`, `tenant_id`, `leccion_id`, `titulo`, `instrucciones` (texto enriquecido, admite LaTeX), `puntaje_maximo` (numérico > 0; **puntaje libre** definido por el creador, p. ej. 30), `fecha_limite` (opcional), `permite_reenvio` (bool).
- `entregas`: `id`, `tenant_id`, `tarea_id`, `alumno_id`, `numero` (reenvíos conservan el historial), `ruta_archivo` (bucket privado `entregas`, ver abajo), `nombre_archivo`, `comentario_alumno`, `enviada_at`. Único por `(tenant_id, tarea_id, alumno_id, numero)`.
- `revisiones`: `id`, `tenant_id`, `entrega_id` (única), `puntaje` (0 ≤ puntaje ≤ `puntaje_maximo`, validado con `check` y en el servidor), `comentario` (texto: dónde mejorar), `revisada_at`. El alumno solo la ve cuando el creador la publica (`publicada_at`).

Almacenamiento: bucket privado `entregas`, mismas reglas que `materiales` (URL firmada de 60 s, ruta con prefijo de `tenant_id`, entra en la cuota por academia). El alumno solo lee sus propias entregas; el creador, las de su academia.

Pantallas:
- Alumno: en la lección, instrucciones, subir/reenviar, y tras la revisión, puntaje y comentarios.
- Creador: «Por revisar» (cola de entregas pendientes por curso), vista de revisión con el archivo a un lado, puntaje, comentario y «Publicar revisión». Aviso por correo al alumno al publicar.

Reglas: `tenant_id` sale de la sesión/host, nunca del body; la nota no se escribe nunca desde el cliente alumno.

## Alternativas descartadas

- **Nota 1,0–7,0 fija:** Samuel eligió puntaje libre por tarea; la escala chilena puede derivarse luego del puntaje.
- **Reusar el quiz con respuesta abierta:** el quiz se corrige en servidor y no tiene archivos ni revisión humana.
- **Entrega por enlace (Drive):** depende del ADR 031 (Propuesta) y deja permisos de lectura fuera de nuestro control.
- **Comprar un LMS externo / integrar Canvas:** contradice el producto white-label por academia.

## Consecuencias

- Tres tablas y un bucket nuevos; migración primero en `supabase-dev`, a producción solo si Samuel lo pide (ADR 037). Actualizar `db/schema.sql`, la suite RLS y `docs/arquitectura`.
- La revisión es trabajo manual del creador: conviene medir tiempo de revisión por entrega antes de sumar rúbricas o revisión por IA.
- Fuera de alcance por ahora: rúbricas, calificación por pares, plagio, retroalimentación en el propio PDF.
- **Clases en vivo** (fecha, enlace de Meet, grabación y resumen) es otro ADR, aparte de este.
