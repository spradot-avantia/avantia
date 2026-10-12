# 006 — Estructura de curso: módulos reales

- **Fecha:** 2026-10-12
- **Estado:** Aceptada (Samuel, 2026-10-12)

## Contexto

RQ-10 recortaba la estructura a "sección = texto, sin tabla de módulos". El diseño del Creador exige módulos con nombre y orden, "Agregar módulo" y una estructura sugerida de 3 módulos (Contexto, Casos reales, Aplicación). Las lecciones pueden ser video, texto o documento (CU-03 original: solo video y texto).

## Decisión

- Tablas `modulos` (curso, tenant, título, orden) y `lecciones` (módulo, curso, tenant, título, tipo `video|texto|documento`, `contenido_url`, `contenido_texto`, `orden`), ambas con `tenant_id`, RLS en las 4 operaciones e índices que empiezan por `tenant_id`.
- Claves foráneas compuestas `(curso_id, tenant_id)` y `(modulo_id, tenant_id)` garantizan que un módulo/lección no pueda pertenecer a otro tenant que su curso.
- Reordenar con botones subir/bajar (sin drag & drop) renormalizando `orden` 0..n.
- "Documento" es solo un **enlace** (Google Drive/Docs) validado por lista blanca; los videos admiten YouTube, Vimeo y Drive. No hay subida de archivos en el MVP (ver ADR 005 para la evolución con `storage_path`).
- Objetivos (1 a 3) en `curso_objetivos`.
- Sin tipo "actividad" ni sesiones en vivo en H1.

## Alternativas descartadas

- Mantener "sección = texto": no soporta nombre/orden ni la estructura sugerida del diseño.
- JSON de estructura dentro de `cursos`: dificulta orden, progreso por lección y RLS.

## Consecuencias

- Revierte el recorte de RQ-10 (costo S adicional).
- El player del alumno y el progreso deben leer de `lecciones`.
- Cursos existentes (seed) no tienen módulos hasta que se editen o se vuelva a correr el seed.
