# 020 — Pasarela de pago: Mercado Pago por academia

- **Fecha:** 2026-11-03
- **Estado:** Propuesta (pendiente de aprobación de Samuel; depende de Q7 modelo de ingresos y Q10 país/medio)

## Contexto

Hoy el creador confirma el pago a mano y activa la inscripción (`pagos.medio` = transferencia/factura/sin_costo; `activada_por = 'creador'`). El diseño `04` prevé que solo cambie el disparador: «la pasarela confirma» → inscripción activa. Mercado Pago es la pasarela local del MVP (CLAUDE.md); `lib/mercadopago.ts` y el webhook existen como esqueleto sin lógica. En la plataforma cada academia vende bajo su dominio, por lo que el dinero debe llegar a **la cuenta de cada creador**, no a la de Avantia.

## Decisión propuesta

1. **Cobro con Checkout Pro**: al elegir «Pagar» el servidor crea una *preferencia* para esa inscripción (`external_reference = inscripcion_id`, monto del curso, `back_urls` al sitio de la academia) y redirige. El precio sale siempre de `cursos.precio_centavos` en el servidor, nunca del navegador.
2. **Cuenta del creador por OAuth** (Mercado Pago Connect): cada academia conecta su cuenta; guardamos su `access_token`/`refresh_token` cifrados por tenant. Avantia puede cobrar una comisión por venta (`marketplace_fee`) solo si Q7 lo decide; si no, el cobro va sin comisión. *Por verificar en la documentación de Chile: disponibilidad de OAuth/marketplace y comisión.*
3. **Webhook** `POST /api/webhooks/mercadopago`: verifica la firma `x-signature` (`ts` + `v1`, HMAC-SHA256 sobre `id:[data.id];request-id:[x-request-id];ts:[ts];` con el secreto de la app), **consulta el pago a la API** de Mercado Pago con el token de esa academia, y solo si está `approved` y el monto coincide pasa la inscripción a `activa` (`activada_por = 'pago'`), registra el `pago` con `medio = 'pasarela'` y `referencia_externa = payment.id`.
4. **Idempotencia**: índice único `pagos (tenant_id, referencia_externa)` y transición `pendiente → activa` condicional; reintentos del webhook no duplican nada. El tenant se deduce de la inscripción referenciada, nunca del body.
5. Se mantiene el pago manual para empresas y becas (el diseño lo pide).
6. Reembolsos y disputas: manuales en Mercado Pago por el creador (Q18).

Cambios previstos: migración (tabla `pasarela_cuentas(tenant_id, …tokens cifrados)`, índice único en `pagos`), pantalla «Cobros» del creador para conectar la cuenta, botón «Pagar» en Mis cursos, y editor de precio del curso (hoy no hay forma de fijar `precio_centavos` en el panel).

## Alternativas descartadas

- **Cobrar todo en la cuenta de Avantia y liquidar a mano**: Avantia pasa a ser intermediario de fondos (obligaciones fiscales y de cumplimiento) y crea trabajo operativo.
- **Pegar el access token del creador en un formulario**: más simple, pero maneja credenciales de terceros sin el flujo de autorización y sin revocación limpia. Aceptable solo como paso transitorio con 1–2 design partners.
- **Stripe**: retirado del código; menor cobertura de medios locales.

## Consecuencias

- Requiere decidir Q7 (comisión) y Q10 (Chile y medios de pago) antes de implementar.
- Secretos de pasarela solo en variables de entorno y tokens por tenant cifrados en base; nunca en el repo.
- El estado `pendiente` ya cubre «pago en curso»; añadir `vencida` para preferencias sin pagar tras N días.
