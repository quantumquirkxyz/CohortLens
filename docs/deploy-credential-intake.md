# Deploy Credential Intake

This file captures the minimum external credentials required to finish
production deployment for CohortLens. It intentionally stops at the first
human-gated step.

## Required

### 1. Sepolia smart contracts

Collect:

- `PRIVATE_KEY`
- `SEPOLIA_RPC_URL`

Use:

- `PRIVATE_KEY` lives in `packages/contracts/.env`
- `SEPOLIA_RPC_URL` lives in `packages/contracts/.env`

Purpose:

- Deploy and own `LensToken`, `LensRegistry`, `LensOracle`, and `LensStaking`
  on Sepolia.

Run:

```bash
cd packages/contracts
forge script script/Deploy.s.sol --rpc-url "$SEPOLIA_RPC_URL"
forge script script/Deploy.s.sol --rpc-url "$SEPOLIA_RPC_URL" --private-key "$PRIVATE_KEY" --broadcast
```

Optional verification:

```bash
forge script script/Deploy.s.sol --rpc-url "$SEPOLIA_RPC_URL" --private-key "$PRIVATE_KEY" --broadcast --verify --etherscan-api-key "$ETHERSCAN_API_KEY"
```

Human-gated stop condition:

- The deployer wallet must be funded with test ETH before broadcast.

### 2. Neon PostgreSQL

Collect:

- `DATABASE_URL`

Use:

- Put in Fly secrets for `apps/api` and `packages/indexer`
- Put in local `.env` if you want to run migrations or production-like checks

Purpose:

- Production database for the API and indexer.

Run:

```bash
pnpm --filter @cohortlens/database db:migrate
```

Human-gated stop condition:

- You must create the Neon project and copy the production connection string.

### 3. Fly.io

Collect:

- Fly account access
- `FLY_API_TOKEN` only if deployment is automated from CI or from an agent

Use:

- Deploy `apps/api`
- Deploy `packages/indexer`

Run:

```bash
cd apps/api
fly launch --no-deploy
fly deploy
fly secrets set DATABASE_URL="$DATABASE_URL" CORS_ORIGIN="https://<vercel-app>.vercel.app" RATE_LIMIT_MAX=300 TRUST_PROXY=1

cd ../../packages/indexer
fly launch --no-deploy
fly deploy
fly secrets set DATABASE_URL="$DATABASE_URL" SUBGRAPH_URL_ETHEREUM="https://api.thegraph.com/subgraphs/name/cohortlens/ethereum"
```

Human-gated stop condition:

- A Fly login or token is required for the actual deploy.

### 4. Vercel

Collect:

- Vercel account access

Use:

- Import repo root `apps/web`
- Set `VITE_API_URL` to the Fly API URL

Human-gated stop condition:

- Vercel import and project ownership must be approved by a human.

## Optional

- `ETHERSCAN_API_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `SENTRY_DSN`

## Current stop point

At this stage the repo is ready for:

- Sepolia deploy once wallet + RPC + faucet funds are provided
- Neon provisioning once `DATABASE_URL` is provided
- Fly deploy once account access is available
- Vercel deploy once the project is imported and `VITE_API_URL` is known

## Completed

### Sepolia contracts

Deployed on chain `11155111`:

- `LensToken`: `0xaaCA49d07E07B7d56297C83ea6c2f6Fa0772bD6c`
- `LensRegistry`: `0x8607f1cc875AfA1049a5b28CAc326a3075F159A5`
- `LensOracle`: `0x13091Ca5E132A8B70F4033338dCb5005bD3F3668`
- `LensStaking`: `0x9df3D751e776772C2C7D15e4E6ffcf28da07F085`

Deployer / treasury:

- `0x578938E218Eb43312946c7B3BcE9009b6beE0f43`

### Neon PostgreSQL

Migrations applied successfully to the provided `DATABASE_URL`.
