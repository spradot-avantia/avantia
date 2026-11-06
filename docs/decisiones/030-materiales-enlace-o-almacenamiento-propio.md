# 030 — Materiales: enlace externo o almacenamiento de la plataforma

- **Fecha:** 2026-11-05
- **Estado:** Aceptada (aprobada por Samuel el 2026-11-05; la implementación queda en el backlog)

## Contexto

Samuel pidió decidir dónde viven los objetos (documentos, videos, materiales) y quiere ofrecer **ambas vías**, como Canvas: pegar la URL de un espacio externo (Drive, OneDrive…) o subir el archivo a la plataforma, todo en un mismo lugar. Hoy los documentos y materiales son solo **enlaces https** (ADR 008, ADR 029) y el único archivo subido es el logo, en un bucket público de Supabase Storage (ADR 005). El stack ya es Supabase (Postgres + Storage + RLS); Firestore, AWS S3 y RDS no están en uso y añadirlos sumaría un proveedor, credenciales y un segundo modelo de aislamiento por tenant.

## Decisión (recomendada)

1. **Metadatos en Postgres, archivos en Supabase Storage.** No se incorpora Firestore ni AWS en el MVP.
2. **Dos orígenes por material/lección**, elegidos por el creador: `enlace` (https, como hoy) o `archivo` (subido). Un solo campo de origen y un solo punto de lectura en la vista del alumno.
3. **Bucket privado `materiales`**, ruta `{tenant_id}/{curso_id}/{uuid}`, con **URLs firmadas** de corta duración emitidas tras verificar inscripción o propiedad (el diseño ya previsto en ADR 005; usa `lecciones.storage_path` y `contenido_tipo`). Tabla `materiales` ampliada con `origen`, `storage_path`, `mime`, `bytes`.
4. **Límites iniciales:** lista de mime permitidos (PDF, imágenes, Office), tope por archivo (propuesto 25 MB) y cuota por academia a definir con el plan comercial.
5. **Video:** sigue como enlace (YouTube, Vimeo, Drive). El alojamiento propio de video queda fuera del MVP por costo de ancho de banda y transcodificación.

## Costos de Supabase Storage (consultados el 2026-11-05 en la documentación oficial y supabase.com/pricing)

| | Free (hoy) | Pro (US$25/mes) |
|---|---|---|
| Almacenamiento incluido | 1 GB | 100 GB |
| Descarga mensual (egress) | 5 GB sin caché + 5 GB con caché | 250 GB + 250 GB con caché |
| Tamaño máximo por archivo | 50 MB | hasta 500 GB (configurable) |
| Exceso de almacenamiento | no se puede; aviso y periodo de gracia | US$0,0213 por GB al mes |
| Exceso de descarga | igual | US$0,09 por GB (US$0,03 con caché) |
| Pausa por inactividad | sí, tras 1 semana | no |

Lectura para este ADR:

- El tope de 25 MB por archivo cabe en los 50 MB del Free.
- 1 GB (compartido con los logos y entre todas las academias) alcanza para el piloto. La descarga es el límite que se agota primero: un PDF de 5 MB bajado por 200 estudiantes consume 1 GB de los 5 GB mensuales.
- En Free no se cobra, pero al superar el cupo hay aviso y periodo de gracia, y después pueden restringirse el servicio y las subidas.
- La pausa por inactividad ya es un riesgo para cualquier academia en producción, con o sin archivos.
- Ejemplo (no es proyección de uso): en Pro, una academia con 50 GB almacenados y 400 GB de descarga pagaría unos US$13,50 al mes de exceso de descarga y nada de almacenamiento.

**Recomendación de costo:** activar las subidas dentro del plan Free con tope de 25 MB y avisos de uso; pasar a Pro cuando haya academias reales cobrando, o antes si la pausa por inactividad molesta.

## Otras opciones evaluadas (precios consultados el 2026-11-05 en las páginas de cada proveedor)

| Opción | Costo aproximado | Ventaja | Riesgo / costo oculto |
|---|---|---|---|
| **A. Supabase Storage** (recomendada) | Free: US$0; Pro: US$25/mes + exceso (tabla anterior) | Mismo proveedor, RLS y URLs firmadas ya integradas con el esquema por tenant | Descarga limitada (5 GB en Free); pausa por inactividad en Free |
| **B. Cloudflare R2** (compatible con S3) | US$0,015/GB al mes; 10 GB gratis; **descarga gratis** | Sin cobro de egress; el más barato si hay muchas descargas | Segundo proveedor; el aislamiento por tenant y las URLs firmadas se programan en la app (sin RLS) |
| **C. Backblaze B2** | Desde US$6,95/TB al mes (~US$0,007/GB); 10 GB gratis; descarga gratis hasta 3× lo almacenado | Almacenamiento muy barato | Igual que B; más lento de integrar con CDN propio |
| **D. AWS S3** | Cerca de US$0,023/GB al mes + descarga ~US$0,09/GB (**no verificado hoy**) | Estándar de industria | Mismo costo de descarga que Supabase Pro, más complejidad: IAM, regiones, facturación aparte |
| **E. Servidor privado** (VPS con MinIO u otro almacenamiento compatible con S3) | Desde ~€6,5/mes por servidor pequeño en Hetzner (sin sedes en Latinoamérica: EE. UU., Alemania, Finlandia, Singapur) | Precio fijo y descarga incluida; control total | Hay que operarlo: respaldos, parches de seguridad, monitoreo, disponibilidad, TLS y escalado. Un solo servidor es un punto único de falla. Para un equipo de un developer y un aprendiz, el costo real es tiempo |
| **F. Supabase autoalojado** (todo en servidor propio) | Servidor mediano (~€15–45/mes) + operación | Sin límites de plan | Se pierde el servicio administrado de base de datos, auth y respaldos: cambia la arquitectura completa (revisar ADR 010) |

Lectura:

- **Servidor privado (E/F):** conviene solo si la descarga masiva de archivos se vuelve el mayor costo o si un cliente exige alojar los datos en su infraestructura. Hoy no se cumple ninguna de las dos, y sumaría trabajo de operación que el equipo no tiene. Se deja como opción futura, no para el MVP.
- **Ruta de crecimiento propuesta:** Supabase Storage en Free (MVP) → Pro cuando haya academias cobrando → R2 solo si la descarga supera los 250 GB al mes y el costo de egress pesa. Para facilitar un cambio posterior, la app accede a los archivos a través de una sola función (`storage_path` + generación de URL firmada), de modo que cambiar de proveedor no toque la interfaz.

## Nota de implementación (2026-11-06)

- **Materiales (migración 0017):** aplicada; en producción y verificada de punta a punta (ver BACKLOG B-30). Cuota de 100 MB por academia y 25 MB por archivo, validadas en la aplicación y, el tope por archivo y los tipos, también en el bucket.
- **Lecciones de tipo documento (migración 0018):** una lección de tipo documento admite enlace **o** archivo, igual que un material. Reutiliza `lecciones.storage_path` y `contenido_tipo` (ADR 005) y suma `archivo_nombre` y `bytes`. La cuota se comparte con los materiales. Se abre en pestaña nueva, sin visor incrustado, por una ruta del servidor que firma una URL de 60 s tras comprobar sesión, inscripción activa y lección liberada.

## Alternativas descartadas

- **Firestore / AWS S3 + RDS:** segundo proveedor y segundo modelo de seguridad; se pierde RLS por tenant y el equipo es pequeño.
- **Solo enlaces (statu quo):** deja al estudiante con errores si el creador deja el archivo privado.
- **Solo almacenamiento propio:** obliga a subir lo que el creador ya tiene en Drive y encarece el almacenamiento.

## Consecuencias

- Nueva migración (columnas de `materiales`, bucket y políticas de Storage por `tenant_id`) y actualización de `schema.sql`.
- Costo de Storage y egress crece con el uso (ver tabla); hay que fijar cuota por plan.
- Verificación de tipo por bytes y antivirus/escaneo quedan como riesgo a evaluar antes de abrir subidas.
- Al aprobarse, se borra el pendiente «Bucket privado `materiales`» de `Supuestos_y_Pendientes.md`.
