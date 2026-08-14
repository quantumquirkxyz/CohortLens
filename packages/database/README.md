# @cohortlens/database

PostgreSQL access for CohortLens: Drizzle ORM schema for the Capital Flow
Graph, migrations, sample seed data, and graph repository functions.

## Commands

```bash
pnpm --filter @cohortlens/database db:generate   # generate SQL migration (drizzle-kit)
pnpm --filter @cohortlens/database db:migrate    # apply migrations to DATABASE_URL
pnpm --filter @cohortlens/database db:seed       # insert the sample graph (idempotent)
pnpm --filter @cohortlens/database test          # integration tests (needs Docker Postgres)
```

Requires `DATABASE_URL` (see `.env.example`); defaults to
`postgres://cohortlens:cohortlens@localhost:5432/cohortlens`.

## Schema

- **Nodes**: `chains`, `protocols`, `wallets`, `assets`, `pools`, `positions`
- **Edges**: `capital_flows` (typed `from`/`to` node references, `flow_type` enum)
- **Analytics**: `cohort_metrics`, `protocol_metrics` (seeded empty; filled by
  topological analysis in Fase 3)

See `src/schema.ts` and ADR 004 (updated to Drizzle when implementing issue #8).
