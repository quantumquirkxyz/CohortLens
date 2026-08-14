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
├── shared/     # Shared types and utilities (@cohortlens/shared)
├── database/   # PostgreSQL access (@cohortlens/database)
├── lenses/     # Lens registry, execution engine and mock lenses (@cohortlens/lenses)
├── contracts/  # Solidity smart contracts (Foundry, @cohortlens/contracts)
└── indexer/    # On-chain indexer (Fase 6): The Graph subgraph + Hono sync service
```

## Smart contracts (Fase 4)

Foundry project in `packages/contracts` (Solidity 0.8.28, OpenZeppelin 5.6):
`LensToken` (ERC20, 1B cap), `LensRegistry` (pricing bounds 0.1–1000 LENS),
`LensOracle` (5% protocol fee to treasury) and `LensStaking` (5% base APY +
lock bonus). See `docs/adr/005-smart-contracts.md` and `docs/adr/008-tokenomics.md`.

```bash
cd packages/contracts
forge test                 # 39 tests
forge coverage             # > 98%
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
```

Deployment to a testnet (Sepolia) is ready via the same script but requires
wallet credentials — see issue #16.

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

## API endpoints (apps/api)

Base URL: `http://localhost:8000`

### Graph (Fase 1)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/graph/nodes` | List all nodes of the Capital Flow Graph |
| GET | `/api/graph/flows?page=&limit=` | List capital flows (paged) |
| GET | `/api/graph/flow/:id` | Get a single capital flow |
| POST | `/api/graph/flows` | Ingest a capital flow (indexer webhook) |
| GET | `/api/graph/stats` | Graph statistics (node/flow counts) |
| GET | `/api/graph/neighborhood/:id` | Flows touching a node |

### Lenses (Fase 2)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/lenses` | List registered Lenses |
| GET | `/api/lenses/:id` | Lens metadata |
| POST | `/api/lenses` | Register a Lens (metadata-only) |
| POST | `/api/lenses/:id/publish` | Activate a Lens |
| POST | `/api/lenses/:id/execute` | Execute a Lens (`{ params }`) |
| GET | `/api/lenses/:id/results` | Latest execution result |

### Analysis (Fase 3)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/analysis/communities` | Detect wallet Cohorts (community detection) |
| GET | `/api/analysis/path?source=&target=` | Cheapest path between two nodes |
| GET | `/api/analysis/centrality` | Degree + betweenness centrality |
| GET | `/api/analysis/co-movement?assets=USDC,DAI` | Asset correlation over daily volume |
| POST | `/api/analysis/custom` | Dispatch a custom analysis (`{ algorithm, params }`) |

## Dashboard (apps/web)

React 19 + Vite + Tailwind dashboard (Fase 5, ADR 007) served at :3000. The
Vite dev server proxies `/api` to the API on :8000, so the pages consume the
same REST endpoints as curl:

| Route        | Page                                                            |
| ------------ | --------------------------------------------------------------- |
| `/`          | Overview (graph stats + recent flows)                           |
| `/graph`     | Capital Flow Graph explorer (React Flow, neighborhood panel)    |
| `/lenses`    | Lens marketplace (register, publish, execute, results)          |
| `/cohorts`   | Wallet cohorts + asset co-movement chart (Recharts)             |
| `/routes`    | Cheapest-path optimizer                                         |
| `/protocols` | Protocols and chains table                                      |
| `/settings`  | Placeholder                                                     |

Stack: `@xyflow/react`, `@tanstack/react-query`, `zustand`, `recharts`,
`react-router-dom`, and `wagmi` (wallet connect — requires a browser wallet;
contracts deploy is still pending Fase 4 credentials).

## Indexer (packages/indexer, Fase 6)

The Graph subgraph in `packages/indexer/subgraph` indexes `CFGEvents` from the
LensOracle contract into `CapitalFlow` entities (assemblyscript mapping, run
`pnpm --filter @cohortlens/indexer graph:codegen && graph:build`). The Hono
sync service polls it and writes into PostgreSQL:

- `POST /sync` — poll one chain (`{ "chain": "ethereum" }`), advance the cursor
  stored in `sync_state`, and upsert the CFG nodes/flows it references.
- `GET /health`, `GET /status` — liveness and per-chain cursor positions.

Configure endpoints per chain with `SUBGRAPH_URL_ETHEREUM=...` env vars; the
service runs with `pnpm --filter @cohortlens/indexer dev` on port 8001.

## Testing & CI/CD (Fase 7)

- **Unit/integration**: Vitest across packages (`pnpm test`); the `database`
  suite runs against a dedicated `cohortlens_test` PostgreSQL database that the
  global setup creates, migrates and seeds per run.
- **Coverage**: the core packages (`shared`, `database`, `lenses`, `api`,
  `indexer`) enforce a **>80%** statements/lines threshold via vitest v8
  (`pnpm --filter @cohortlens/<pkg> exec vitest run --coverage`).
- **E2E**: Playwright smoke tests in `e2e/` (`pnpm e2e`) boot the API (:8000)
  and web (:3000), migrate/seed the DB, and verify the dashboard renders the
  real graph (overview stats, React Flow canvas, lenses page).
- **CI**: `.github/workflows/ci.yml` runs lint, type-check, test, build,
  coverage and E2E in parallel on every push/PR — PostgreSQL via a service
  container and Foundry via the official toolchain action.

## Default ports

| Service      | Host port                        |
| ------------ | -------------------------------- |
| API          | 8000 (`PORT`)                    |
| Web (Vite)   | 3000                             |
| Indexer      | 8001                             |
| PostgreSQL   | 5432 (`POSTGRES_PORT`)           |

## License and community

This project is licensed under the MIT license; see [LICENSE](LICENSE).

- [Contributing](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security](SECURITY.md)
- [Releases](RELEASE.md)
