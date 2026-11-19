# 046 — Pasarela fase 1: Checkout Pro con una cuenta de prueba en dev

- **Fecha:** 2026-11-19
- **Estado:** Propuesta (pendiente de aprobación de Samuel). El código vive solo en dev.

## Contexto

El video demo del MVP (B-48, Start-Up Chile Build) muestra a un alumno que paga un curso con Mercado Pago. El [ADR 020](020-pasarela-de-pago-mercado-pago.md) (Propuesta) describe la pasarela completa, pero su punto 2 (cuenta de cada creador por OAuth/Connect) depende de Q7 (comisión) y Q10 (Chile y medios), que siguen abiertas. Hace falta un cobro real de punta a punta sin cerrar esas preguntas.

## Decisión

Implementar los puntos 1, 3, 4 y 5 del ADR 020 con **una sola cuenta de Mercado Pago** (vendedor de prueba en dev):

1. **Precio** en el editor (paso Acceso), en CLP sin decimales; se guarda en `cursos.precio_centavos` (pesos × 100). Mínimo $1.000, máximo $5.000.000; 0 = gratis.
2. **Checkout Pro**: `pagarCursoAction` crea o reutiliza la inscripción `pendiente` y una preferencia con `external_reference = inscripcion_id`, `metadata.tenant_id`, precio desde la base, `currency_id = CLP`, `back_urls` al dominio de la academia (`/pago/retorno`) y `notification_url` solo si es https. Siempre `init_point`. `auto_return` solo con `back_urls` https.
3. **Acreditación única** `lib/pagos/acreditar.ts`: consulta el pago a la API (`Payment.get`) y exige `approved`, misma referencia, misma academia, CLP y monto igual al precio. La llaman la página de retorno (no confía en el `status` del query) y el webhook.
4. **Webhook** con firma `x-signature` (HMAC-SHA256, `timingSafeEqual`, tolerancia de 5 min) validada antes de leer el cuerpo; 401 si falla.
5. **Idempotencia**: índice único `pagos (tenant_id, referencia_externa)` (migración 0026) y transición condicional `pendiente → activa` (`activada_por = 'pago'`).
6. Sin comisión de Avantia (coherente con ADR 041). El pago manual sigue igual.
7. `PAGOS_HABILITADOS=false` o la falta de `MERCADOPAGO_ACCESS_TOKEN` ocultan el botón de pago: el curso con precio vuelve al flujo manual.

## Alternativas descartadas

- **Página que imita el checkout de Mercado Pago para el video**: suplanta una marca y no prueba nada.
- **Esperar a OAuth por academia**: bloquea el video y el aprendizaje del flujo por decisiones de negocio abiertas.
- **Transacción en una RPC `security definer`**: el índice único más la actualización condicional ya dan idempotencia sin agregar otra función expuesta.

## Consecuencias

- **No sirve para producción multi-academia**: todo el dinero llegaría a una sola cuenta. Antes de Production: OAuth/Connect por academia (o token por academia como transición con 1–2 design partners, ADR 020), credenciales reales y verificación en Chile.
- Variables nuevas (solo `.env.local` y Vercel Preview): `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`, `MERCADOPAGO_NOTIFICATION_URL`, `PAGOS_HABILITADOS`, `PAGOS_RETORNO_PROTO` (solo demo local en http).
- La tolerancia de 5 min de la firma se debe confirmar con `notifications_history` (reintentos de Mercado Pago); si rechaza reintentos legítimos, se amplía. La página de retorno cubre el caso mientras tanto.
