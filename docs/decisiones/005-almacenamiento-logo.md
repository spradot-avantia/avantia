# 005 — Almacenamiento y validación del logo (y evolución a materiales)

- **Fecha:** 2026-10-12
- **Estado:** Propuesta

## Contexto

El diseño del Creador permite subir un logo (PNG/JPG/SVG/WebP, ≤ 2 MB, ≥ 128 px por lado) que se muestra en el panel del creador y en el sitio público de la academia. CR-04 original pedía identidad genérica con iniciales; el logo es opcional y las iniciales son el respaldo. Un SVG puede contener scripts: servido desde el mismo origen que la app, es un vector de XSS (NF-20). Samuel confirmó (2026-10-12) aceptar SVG con sanitización.

## Decisión

- **Bucket público `logos`** en Supabase Storage, ruta `{tenant_id}/logo-<timestamp>.<ext>`. Lectura pública (el logo aparece en sitios públicos); escritura/borrado solo del miembro del tenant (política sobre `storage.foldername(name)[1] = auth_tenant_id()`). Límite de bucket 2 MB y mime permitidos (migración `0001`).
- **Validación en servidor** (`lib/creador/validacion.ts`): el tipo se detecta por los bytes (no por el mime declarado), tamaño ≤ 2 MB, dimensiones ≥ 128 px leídas de la cabecera.
- **SVG sanitizado, no confiado:** se eliminan `script`, `foreignObject`, `iframe`, `use`, `image`, `style`, animaciones, atributos `on*`, `href` y estilos con `url()`; se rechaza si algo sospechoso sobrevive. Se guarda la versión sanitizada. Alternativa futura si hace falta menos superficie: rasterizar a PNG.
- Logos con proporción > 1,8:1 se sugieren como `solo_logo` (`tenants.logo_modo`).
- Al reemplazar o quitar el logo se borra el objeto anterior.

### Evolución prevista (no implementada): bucket privado `materiales`

Cuando "Documento" pase de enlace a archivo subido: bucket **privado** `materiales`, ruta `{tenant_id}/{curso_id}/{uuid}`, acceso con **URLs firmadas** de corta duración emitidas tras verificar inscripción/propiedad, mime y tamaño permitidos por lista. El modelo ya lo prevé: `lecciones.storage_path` y `lecciones.contenido_tipo` (nullable, sin uso en MVP) junto a `contenido_url`.

## Alternativas descartadas

- Guardar el logo en base como base64: infla filas y cachea mal.
- Aceptar SVG sin sanitizar: riesgo de XSS inaceptable.
- Excluir SVG: descartado por Samuel; queda como plan B.
- Un bucket por tenant: más difícil de operar; la carpeta por tenant con política RLS da el mismo aislamiento.

## Consecuencias

- Requiere aplicar la migración `0001` (bucket y políticas) en Supabase.
- El sanitizador es de lista de bloqueo: mantener sus tests y revisarlo si se amplía el formato.
- Las URLs públicas del bucket no se pueden revocar sin borrar el objeto.
