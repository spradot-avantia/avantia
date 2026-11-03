# 019 — Términos y privacidad del alumno en el sitio de la academia

- **Fecha:** 2026-11-03
- **Estado:** Aceptada (Samuel, 2026-11-03). **El texto base requiere revisión legal URGENTE antes de abrir a alumnos reales** (B-19); se mejorará después de esa revisión

## Contexto

El registro del alumno enlazaba a `/terminos` y `/privacidad` de la plataforma, que son los textos de Avantia para creadores. La política de privacidad de la plataforma (sección 7) ya dice que, respecto de los alumnos de una academia, **la academia es la responsable y Avantia actúa como encargada**. Con la Ley 21.719 (se asume vigencia desde diciembre de 2026, decisión de Samuel; confirmar con el abogado), el responsable es quien decide para qué y cómo se tratan los datos, y el encargado debe tratarlos por cuenta de aquel bajo un contrato.

## Decisión

- El alumno acepta, **en el host de la academia**, términos y privacidad **de la academia** (`/terminos`, `/privacidad` dentro del sitio del tenant), que nombran a la academia como responsable y a Avantia como proveedor/encargado. Sin marca Avantia en el diseño; solo se la nombra como encargada.
- La relación Avantia ↔ academia se cubre con el texto de la plataforma que acepta el creador (hoy sección 7 de la privacidad; a futuro, un anexo de encargo de tratamiento al aceptar los términos del creador).
- Texto base común con el nombre de la academia (`components/alumno/PaginaLegal.tsx`). Más adelante la academia podrá agregar sus propias condiciones (devoluciones, datos de contacto), guardadas por tenant.
- Los derechos del titular se piden a la academia; el contacto de la plataforma deriva si no hay respuesta.

## Alternativas descartadas

- Enlazar a los textos de la plataforma: confunde quién es responsable y contradice la sección 7.
- Que Avantia sea responsable de los datos de los alumnos: carga legal y de soporte desproporcionada, y rompe la promesa «los datos de tus alumnos son tuyos».

## Consecuencias

- Hay que sumar a `tenants` un correo de contacto de la academia para mostrarlo (pendiente; hoy el texto remite al medio con que la academia atiende).
- Revisión legal del texto base y del anexo de encargo antes del piloto con alumnos reales.
