# Avantia

Plataforma multi-tenant para que academias vendan y dicten cursos online bajo su
propio dominio.

Stack: **Node.js (Express) + React (Vite)**, monorepo con npm workspaces.

## Estructura

```
avantia/
├── apps/
│   ├── api/     # Backend Node.js + Express + TypeScript
│   └── web/     # Frontend React + Vite + TypeScript
├── db/          # Esquema y migraciones de Postgres (Supabase)
├── docs/        # Documentación del proyecto (arquitectura, decisiones, sprints, skills)
└── .github/     # Workflows de CI (revisión de PRs con Claude Code)
```

Ver el detalle de arquitectura en
[docs/arquitectura/Avantia_Estructura_Codigo_Arquitectura.md](docs/arquitectura/Avantia_Estructura_Codigo_Arquitectura.md).

## Desarrollo local

```bash
npm install

# terminal 1
npm run dev:api

# terminal 2
npm run dev:web
```

Cada app tiene su propio `.env.example` con las variables necesarias
(`apps/api/.env.example`, `apps/web/.env.example`).

## Despliegue

- `apps/web` se despliega como sitio estático (build de Vite) en Vercel.
- `apps/api` se despliega como servicio Node.js persistente (no como funciones
  serverless de Next.js) — ver ADR
  [docs/decisiones/001-migracion-nextjs-a-node-react.md](docs/decisiones/001-migracion-nextjs-a-node-react.md)
  para la razón del cambio de stack y sus implicancias.
