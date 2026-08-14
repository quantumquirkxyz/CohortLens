# CohortLens

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A DeFi platform powered by Graph Engineering: it maps, predicts, and recommends
on complex capital flows between multiple protocols and blockchains. See
[`CONTEXT.md`](CONTEXT.md) for the domain glossary (Capital Flow Graph, Lenses,
Cohorts, etc.).

## Monorepo architecture

Turborepo + pnpm workspaces, TypeScript everywhere.

```text
apps/
├── api/       # Hono backend (REST API, port 8000)
└── web/       # React 19 + Vite + Tailwind 4 dashboard (port 3000)
packages/
├── shared/    # Shared types and utilities (@cohortlens/shared)
└── database/  # PostgreSQL access (@cohortlens/database)
```

## Requirements

- **Node.js** 20+
- **pnpm** 11 (`corepack enable && corepack prepare pnpm@11.21.0 --activate`)
- **Docker** + Docker Compose (for PostgreSQL)

## Quick start

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Start PostgreSQL in Docker:

   ```bash
   docker compose -f docker/compose.yaml up -d postgres
   ```

3. Copy environment variables:

   ```bash
   cp .env.example .env
   ```

4. Run the dev environment (API + web, with hot reload):

   ```bash
   pnpm dev
   ```

   - API: [http://localhost:8000/health](http://localhost:8000/health) → `{"status":"ok"}`
   - Web: [http://localhost:3000](http://localhost:3000)

## Scripts

| Command             | Description                              |
| ------------------- | ---------------------------------------- |
| `pnpm dev`          | Run API and web with hot reload (turbo)  |
| `pnpm build`        | Build all packages                       |
| `pnpm test`         | Run tests (Vitest)                       |
| `pnpm lint`         | Lint with ESLint                         |
| `pnpm type-check`   | Type-check all packages                  |

## Default ports

| Service      | Host port                        |
| ------------ | -------------------------------- |
| API          | 8000 (`PORT`)                    |
| Web (Vite)   | 3000                             |
| PostgreSQL   | 5432 (`POSTGRES_PORT`)           |

## License and community

This project is licensed under the MIT license; see [LICENSE](LICENSE).

- [Contributing](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security](SECURITY.md)
- [Releases](RELEASE.md)
