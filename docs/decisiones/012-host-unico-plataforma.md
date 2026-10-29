# 012 — Host único para landing y panel (`goavantia.com`)

- **Fecha:** 2026-10-27
- **Estado:** Propuesta (implementada en `dev`, espera la aprobación de Samuel)

## Contexto

El ADR 003 separa landing (`avantia.app`) y panel (`app.avantia.app`) por host y deja la sesión solo en el panel. Al desplegar en `avantia-nu.vercel.app` (un único host) la landing daba 404 y `/postular` entraba en bucle de redirecciones, porque el host no era ninguno de los configurados. El dominio real es `goavantia.com`; Samuel pidió dejar todo en un solo host.

## Decisión

- Nuevo tipo de host `plataforma` (variable `PLATFORM_HOSTS`, p. ej. `goavantia.com,www.goavantia.com`) que sirve landing y panel en el mismo dominio.
- En ese host, `middleware.ts` reescribe `/` **siempre** a `/landing`. El inicio del panel pasa de `/` a `/inicio`; el creador entra por `/login` (enlace "Ingresar" de la landing) o `/postular`. El resto de rutas (`/postular`, `/login`, `/cursos`…, `/privacidad`) no chocan y se sirven tal cual. Refresca la sesión como en el panel. En el host de panel de dos hosts, `/` redirige a `/inicio`.
- `hostEsPanel()` es verdadero para `panel` y `plataforma`, así que los redirects a `NEXT_PUBLIC_PANEL_URL` dejan de ciclar al apuntar al mismo host.
- Las academias siguen en otros hosts (subdominios `*.goavantia.com` o dominio propio): la comparación del host es exacta, así que no se confunden con la plataforma. Siguen sin leer la sesión del creador.
- Los modos de dos hosts (`MARKETING_HOSTS` + `PANEL_HOST_SUFFIX`) siguen funcionando; `PLATFORM_HOSTS` vacío los deja como antes.

## Alternativas descartadas

- Dos hosts (`goavantia.com` + `app.goavantia.com`): mantiene el ADR 003 intacto, pero Samuel prefiere un solo host por ahora.
- Mover el dashboard a `/panel` para liberar `/`: refactor grande de enlaces y rutas sin necesidad.

## Consecuencias

- Reemplaza parcialmente al 003 en "sesión solo en el host del panel": la cookie ahora vive también en el host de la landing. Al aprobarse, marcar el 003 como "Reemplazada parcialmente por 012".
- `/` ya no es el inicio del panel: todo redirect post-login apunta a `/inicio` (`sanitizarNext` usa `/inicio` por defecto).
- Con la landing en el mismo origen que el panel, un XSS en la landing alcanzaría la sesión del creador: hay que mantener la landing sin HTML de terceros ni scripts no revisados.
- Subdominios `www`, `app`, etc. ya están reservados para academias (`reservados.ts`).
