# 013 — Postulación con cuenta de correo o Google (Google deja de ser obligatorio)

- **Fecha:** 2026-10-29
- **Estado:** Reemplazada por 014 (postular sin cuenta; el registro de correo/Google queda para quien sea invitado)

## Contexto

El ADR 011 exigía entrar con Google antes del formulario del programa fundador, y la landing decía que los creadores no usan correo y contraseña. Al probar en producción, Samuel pidió que la postulación permita crear la cuenta como en el panel del creador (correo y contraseña, o Google), que `goavantia.com` muestre siempre la landing y que la landing ofrezca tanto "Ingresar" como "Postular".

## Decisión

- `/postular` paso 1 ofrece el mismo alta que `/signup` (`FormSignup`, correo + contraseña ≥10 con confirmación de correo) **y** el botón de Google. Para quien ya tiene cuenta, enlace a `/login?next=/postular`.
- Sigue siendo necesaria una cuenta: la tabla `postulaciones` y su RLS por `user_id` (ADR 011) no cambian. Sin migraciones.
- `signUpAction` recibe `next` (validado con `sanitizarNext`); como la plantilla de correo usa `{{ .SiteURL }}` y no lleva `next`, se guarda en la cookie `av-next` (httpOnly, 24 h, path `/auth`) y `/auth/confirm` vuelve a `/postular` tras confirmar un `signup`.
- La landing: cabecera con "Ingresar" (`/login`) y "Postular"; el CTA principal pasa de "Postula con tu cuenta de Google" a "Postula al programa fundador" más "¿Ya tienes cuenta? Ingresar". La FAQ "¿Cómo postulo?" se corrige.
- Se reemplaza la decisión de producto "creador entra solo con Google" (revisión de flujos 2026-10-12) por "correo y contraseña o Google".

## Alternativas descartadas

- Postular sin cuenta: pierde la identidad verificada y abre la puerta al spam (descartado también en el 011).
- Poner `next` en la plantilla de correo con `{{ .RedirectTo }}`: exige cambiar la plantilla en Supabase a mano; la cookie evita esa dependencia.

## Consecuencias

- Una cuenta con correo y contraseña puede entrar a `/inicio` y crear una academia sin postulación aceptada (Q4 sigue abierta, igual que con Google).
- Hay más superficie de abuso (registros con correos falsos) que con Google; Supabase aplica sus límites y hay un limitador mínimo en memoria. Con tráfico real, ver NF-23.
- Si el correo se confirma en otro dispositivo o navegador, la cookie no existe: el creador cae en `/inicio` y puede volver a `/postular` a mano.
- Requiere "Confirm email" activado en Supabase (ya exigido en producción por `Configuracion_Auth_Supabase.md`).
