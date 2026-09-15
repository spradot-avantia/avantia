# 001 — Migración de Next.js a Node.js + React

- **Fecha:** 2026-09-15
- **Estado:** Aceptada

## Contexto

La arquitectura original de Avantia (ver
[docs/arquitectura](../arquitectura/Avantia_Estructura_Codigo_Arquitectura.md))
estaba diseñada sobre Next.js App Router, aprovechando su middleware de edge
para resolver el tenant por hostname y sus route groups para separar el
panel interno del sitio público de cada academia dentro del mismo proyecto.

Se decidió cambiar el stack a **Node.js + React** puro.

## Decisión

- Backend: **Node.js + Express + TypeScript** (`apps/api`), servicio HTTP
  persistente (no funciones serverless de Next.js).
- Frontend: **React + Vite + TypeScript** (`apps/web`), compilado como SPA
  estática.
- Monorepo con **npm workspaces** (`apps/*`).
- El resto del diseño se mantiene: Supabase (Postgres + RLS) para datos y
  autenticación, Stripe/Mercado Pago Connect para pagos con split payment,
  Bunny Stream/Mux para video, y un único endpoint centralizado para las
  llamadas al LLM.

## Alternativas descartadas

- **Mantener Next.js**: se descarta por la decisión explícita de cambiar de
  stack (no una limitación técnica de Next.js en sí).
- **Un solo servidor Node.js sirviendo tanto la API como el HTML del
  frontend (SSR manual)**: se descarta para esta primera versión por
  simplicidad — separar backend y frontend permite desplegar cada uno de
  forma independiente y usar Vite sin acoplar un motor de SSR propio. Queda
  como opción a futuro si el trade-off de SEO (ver más abajo) se vuelve
  crítico.

## Consecuencias

- **Se pierde el middleware de edge y el rewrite automático de Next.js.**
  El equivalente se construye a mano: `apps/api/src/middleware/resolveTenant.ts`
  resuelve el tenant en el backend por request, y
  `apps/web/src/lib/tenantContext.tsx` lo resuelve en el cliente contra un
  endpoint (`GET /api/tenants/resolve`) para el sitio público.
- **Se pierde el server-side rendering.** Las páginas públicas de venta de
  cursos ya no se prerenderizan en servidor; el contenido aparece después de
  que el JavaScript carga en el navegador. Esto es una desventaja de SEO
  respecto a la versión con Next.js. Ver la sección 4 del documento de
  arquitectura para el detalle y la opción de agregar SSR más adelante solo
  para el sitio público si hace falta.
- **Despliegue en dos piezas** en vez de una: `apps/web` como sitio estático
  y `apps/api` como servicio Node.js persistente, en lugar de un único
  proyecto de Vercel con funciones serverless integradas.
- Gana simplicidad conceptual: cada parte del sistema (API REST vs. UI) es
  un proyecto Node.js estándar, sin las convenciones específicas de Next.js
  (route groups, server/client components, route handlers).
