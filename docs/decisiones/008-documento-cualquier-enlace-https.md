# 008 — Lecciones "Documento": cualquier enlace https

- **Fecha:** 2026-10-12
- **Estado:** Aceptada (Samuel, 2026-10-12; ajusta ADR 006)

## Contexto

El ADR 006 limitaba "Documento" a enlaces de Google Drive/Docs. Los creadores usan también Dropbox, OneDrive, Notion, Canva y sitios propios, y la lista blanca los obligaba a mover sus archivos.

## Decisión

- `Documento` acepta **cualquier enlace https** (sin usuario/contraseña en la URL; se rechazan `http:`, `javascript:` y similares). El editor avisa: "Revisa que el enlace permita ver a tus estudiantes".
- `Video` sigue limitado a YouTube, Vimeo y Google Drive; Drive solo si es un archivo embebible (`/file/d/<id>`). El enlace debe ser reconocible como video (no canal ni lista).
- El enlace de documento se muestra al estudiante como enlace que abre en pestaña nueva con `rel="noopener noreferrer"`; nunca se incrusta.
- El modelo conserva `storage_path`/`contenido_tipo` (ADR 005) para archivos propios; no se implementa subida en el MVP.

## Alternativas descartadas

- Mantener la lista blanca de Drive/Docs: fricción innecesaria para el piloto.
- Incrustar documentos de terceros (iframe): superficie de riesgo y muchos servicios lo bloquean.

## Consecuencias

- No podemos garantizar que el enlace sea accesible para el estudiante (permisos del servicio externo): queda como aviso al creador.
- Validación en `lib/creador/validacion.ts` (`validarUrlLeccion`), con pruebas.
