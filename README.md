# Avantia

Plataforma multi-tenant para que academias vendan y dicten cursos online bajo su
propio dominio.

Stack: **Next.js (App Router) + TypeScript**, monorepo con npm workspaces.

## Estructura

```
avantia/
├── apps/
│   └── web/     # Next.js: panel interno, sitio público y API (route handlers)
├── db/          # Esquema y migraciones de Postgres (Supabase)
├── docs/        # Documentación del proyecto (arquitectura, decisiones, sprints, skills)
└── .github/     # Workflows de CI (revisión de PRs con Claude Code)
```

Ver el detalle de arquitectura en
[docs/arquitectura/Avantia_Estructura_Codigo_Arquitectura.md](docs/arquitectura/Avantia_Estructura_Codigo_Arquitectura.md).

## Desarrollo local

```bash
npm install
npm run dev
```

`apps/web` tiene su propio `.env.example` con las variables necesarias.

## Despliegue

- Proyecto único de Next.js (panel, sitio público y API) desplegado en
  Vercel con funciones serverless/edge integradas.
- Ver ADR
  [docs/decisiones/001-migracion-nextjs-a-node-react.md](docs/decisiones/001-migracion-nextjs-a-node-react.md)
  y su reversión en
  [docs/decisiones/002-vuelta-a-nextjs.md](docs/decisiones/002-vuelta-a-nextjs.md).
