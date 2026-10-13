# Configuración de Auth en Supabase (paso a paso)

Para el login con correo y contraseña del creador ([ADR 003](../decisiones/003-identidad-y-sesion.md)). Se hace en el dashboard de Supabase, una vez por proyecto/entorno.

## 1. URLs

Authentication → URL Configuration:

1. **Site URL**: la URL del panel. Producción `https://app.avantia.app`; en un proyecto de desarrollo `http://localhost:3000`.
2. **Redirect URLs** (agrega todas las que uses):
   - `https://app.avantia.app/auth/confirm`
   - `http://localhost:3000/auth/confirm`
   - Previews de Vercel, si quieres probar en ellos: `https://*-tu-equipo.vercel.app/auth/confirm`
3. En Vercel y en `.env.local` define `NEXT_PUBLIC_PANEL_URL` con la misma URL del panel.

## 2. Plantillas de correo

Authentication → Emails → Templates. Cambia el enlace de cada plantilla para que use el token (así la sesión se crea en nuestro servidor):

- **Confirm signup**:
  `<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup">Confirmar mi correo</a>`
- **Reset password**:
  `<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">Elegir una contraseña nueva</a>`

Escribe el asunto y el texto en español. (Opcional, para Change email: mismo patrón con `type=email_change`.)

## 3. Confirmación de correo

Authentication → Sign In / Providers → Email:

- **Producción y staging: "Confirm email" ACTIVADO** (obligatorio).
- **Desarrollo local: puedes apagarlo** para no depender de correos; al crear la cuenta quedas con sesión y pasas directo a `/onboarding`.
- Opcional: sube "Minimum password length" a 10 (la app ya exige 10).

## 4. Límites y correo saliente

- Authentication → Rate Limits: revisa los límites por hora de correos y de intentos.
- El SMTP integrado de Supabase envía muy pocos correos por hora: para producción configura un SMTP propio (Authentication → SMTP Settings).

## 5. Variables de entorno

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_PANEL_URL`, `STAFF_EMAILS`. En producción `ALLOW_DEMO_TENANT` debe quedar sin definir o en `false`.

## 6. Probar

1. `/signup` con un correo real → llega el correo → el enlace abre `/auth/confirm` → te lleva al panel/onboarding.
2. `/login`, cerrar sesión desde el menú, `/olvide-contrasena` → enlace → `/restablecer-contrasena`.
3. Aplica las migraciones `0001_espacio_creador.sql` y `0002` (alta de academia) antes de probar el panel con sesión.
