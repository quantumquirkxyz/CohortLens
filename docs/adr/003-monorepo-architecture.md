# ADR 003: Monorepo Architecture

## Status

Accepted

## Context

CohortLens needs a monorepo structure to manage multiple packages:
- Hono backend API
- React frontend
- Shared types and utilities
- Smart contracts (Foundry)
- The Graph indexer

The stack is TypeScript-first with Foundry for Solidity.

## Decision

Use **Turborepo** with **pnpm** workspaces.

### Directory Structure

```
cohortlens/
├── apps/
│   ├── api/                    # Hono backend
│   ├── web/                    # React frontend (Vite)
│   └── docs/                   # Documentation site
├── packages/
│   ├── shared/                 # Shared TypeScript types and utilities
│   ├── database/               # Prisma schema and client
│   ├── contracts/              # Foundry project (Solidity)
│   ├── indexer/                # The Graph subgraph
│   └── ui/                     # Shared React components
├── turbo.json                  # Turborepo pipeline config
├── pnpm-workspace.yaml         # Workspace definition
├── tsconfig.json               # Root TypeScript config
└── package.json                # Root package.json
```

### Package Dependencies (Layers)

```
Layer 2 — UI (React)
  apps/web, packages/ui

Layer 1 — Services (Domain logic)
  apps/api, packages/database, packages/indexer

Layer 0 — Foundation (Types, contracts)
  packages/shared, packages/contracts
```

### Build Pipeline

```json
{
  "pipeline": {
    "build": { "dependsOn": ["^build"] },
    "dev": { "cache": false, "persistent": true },
    "lint": {},
    "test": { "dependsOn": ["build"] },
    "type-check": { "dependsOn": ["^build"] }
  }
}
```

### TypeScript Configuration

- Shared base config in `packages/typescript-config/base.json`
- Each package extends from base
- Path aliases for internal packages: `@cohortlens/shared`, `@cohortlens/database`

### Package Manager

- **pnpm** for fast installs and strict dependency resolution
- Catalog dependencies in `pnpm-workspace.yaml` for version consistency

## Alternatives Considered

### Nx
- More features (affected analysis, distributed caching)
- Heavier setup, steeper learning curve
- Turborepo is simpler and sufficient for this project size

### Yarn Workspaces
- No built-in task orchestration
- Requires additional tooling (lerna, nx)
- pnpm is faster and more disk-efficient

### npm Workspaces
- Slower than pnpm
- Less strict dependency resolution
- No built-in task orchestration

## Consequences

### Positive
- Clear separation of concerns
- Shared types reduce duplication
- Turborepo caching speeds up builds
- pnpm saves disk space and install time

### Negative
- Initial setup complexity
- Need to manage package versions
- Cross-package refactoring requires care

## References

- [Turborepo docs](https://turbo.build/repo)
- [pnpm workspaces](https://pnpm.io/workspaces)
- [defi-wonderland/ts-turborepo-boilerplate](https://github.com/defi-wonderland/ts-turborepo-boilerplate)
- [cfxdevkit architecture](https://github.com/cfxdevkit/devkit/blob/main/docs/ARCHITECTURE.md)
