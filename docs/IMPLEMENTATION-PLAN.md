# CohortLens — Plan de Implementación Detallado

**Board**: [CohortLens Roadmap](https://github.com/users/quantumquirkxyz/projects/17)
**Última actualización**: Agosto 2026
**Estado**: Research completado, listo para Prototype

---

## 1. Stack Tecnológico (Actualizado Agosto 2026)

### Monorepo
| Capa | Tecnología | Versión | Notas |
|------|-----------|---------|-------|
| Monorepo | Turborepo | 2.10.9 | Rust-based, caching incremental |
| Package manager | pnpm | 11.21.0 | `workspace:` protocol, 2x faster que npm |

### Backend
| Capa | Tecnología | Versión | Notas |
|------|-----------|---------|-------|
| API Framework | Hono | 4.13.2 | Edge-ready, RegExpRouter 20% más rápido |
| ORM | Drizzle ORM | latest | SQL-first, más ligero que Prisma, mejor para queries complejas |
| Database | PostgreSQL | 18.6 | JSONB para datos on-chain, pg_partman para time-series |
| Cache | Valkey | 8.x | Fork open-source de Redis (Linux Foundation) |

### Frontend
| Capa | Tecnología | Versión | Notas |
|------|-----------|---------|-------|
| UI Framework | React | 19.2.8 | React Compiler v1.0 estable |
| Bundler | Vite | 8.2.1 | Rolldown integration |
| CSS | Tailwind CSS | 4.3.3 | CSS-first config, Oxide engine 10x faster |
| State | Zustand | 5.0.14 | ~1KB, TypeScript-first |
| Data Fetching | TanStack Query | 5.101.4 | Stale-while-revalidate, optimistic updates |
| Web3 | wagmi | 8.1.0 | Wallet connection |
| Web3 | viem | 2.55.15 | Type-safe Ethereum interactions |
| Graph Viz | @xyflow/react | 12.11.3 | Para visualizar Capital Flow Graph |
| Charts | Recharts | 3.10.1 | Dashboard, TVL, portfolio charts |

### Smart Contracts
| Capa | Tecnología | Versión | Notas |
|------|-----------|---------|-------|
| Framework | Foundry | 1.7.1 | Parallelized fuzzing, immutable releases |
| Contracts | OpenZeppelin | 5.6.1 | Requiere Solidity `^0.8.24` |
| Compiler | Solidity | 0.8.28 | Auto-detect solc |

### Indexing
| Capa | Tecnología | Versión | Notas |
|------|-----------|---------|-------|
| Subgraphs | The Graph | Horizon | 60+ networks, 1.27T queries served |
| Streaming | Substreams | latest | High-throughput real-time data |
| Sync Service | Hono | 4.13.2 | Reuse del API framework |

### Testing
| Capa | Tecnología | Versión | Notas |
|------|-----------|---------|-------|
| Unit | Vitest | 4.1.10 | Vite-native, Jest-compatible |
| E2E | Playwright | 1.62.1 | Cross-browser, MCP server para AI |
| Solidity | Forge | 1.7.1 | Fuzzing, invariant testing |

### DevOps
| Capa | Tecnología | Versión | Notas |
|------|-----------|---------|-------|
| Containers | Docker Compose | Spec v2 | `compose.yaml`, sin `version:` field |
| CI/CD | GitHub Actions | latest | Workflows para lint, test, deploy |
| Deploy (FE) | Vercel | latest | Frontend hosting |
| Deploy (BE) | Docker | latest | Backend containers |

---

## 2. Decisiones Técnicas Clave

### 2.1 Drizzle ORM > Prisma

**Decisión**: Usar Drizzle ORM en lugar de Prisma.

**Razón**:
- Drizzle es SQL-first: más cercano a SQL nativo, mejor para queries complejas de grafo
- Sin binary engine: más ligero, mejor para serverless/edge
- TypeScript-first: tipos derivados del schema, no codegen
- Mejor rendimiento en queries complejas (JOINs multi-tabla para Capital Flow Graph)
- Prisma 8 (RC) tiene breaking changes significativos — better to avoid

**Schema example**:
```typescript
import { pgTable, text, timestamp, numeric, jsonb } from 'drizzle-orm/pg-core';

export const capitalFlows = pgTable('capital_flows', {
  id: text('id').primaryKey(),
  fromNode: text('from_node').notNull(),
  toNode: text('to_node').notNull(),
  type: text('type').notNull(), // Deposit, Borrow, Repay, Withdraw, Swap, Transfer
  amount: numeric('amount').notNull(),
  asset: text('asset').notNull(),
  chain: text('chain').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  metadata: jsonb('metadata'),
});
```

### 2.2 Valkey > Redis

**Decisión**: Usar Valkey en lugar de Redis.

**Razón**:
- Redis cambió a licencia SSPL/AGPL (no-open-source-friendly)
- Valkey es el fork oficial de Linux Foundation, MPL-2.0
- 100% compatible con Redis API
- Mejor para proyectos open-source como CohortLens

### 2.3 Tailwind CSS v4

**Decisión**: Tailwind v4 con CSS-first configuration.

**Razón**:
- No más `tailwind.config.js` — configuración en CSS con `@theme`
- Oxide engine: 10x más rápido que v3
- Plugin `@tailwindcss/vite` para Vite 8
- Mejor DX para desarrollo rápido

### 2.4 Solidity 0.8.28

**Decisión**: Solidity 0.8.28 para smart contracts.

**Razón**:
- OpenZeppelin 5.6 requiere `^0.8.24`
- 0.8.28 es la versión estable más reciente
- Foundry auto-detect solc por defecto
- Mejoras de gas y seguridad en versiones recientes

### 2.5 Hono como API Gateway Unificado

**Decisión**: Usar Hono para el API backend Y el sync service del indexer.

**Razón**:
- Un solo framework para dos capas
- Edge-ready: puede correr en Vercel Edge Functions
- RegExpRouter: 20% más rápido que v4.12
- Middleware ecosystem: rate limiting, auth, CORS

---

## 3. Estructura del Monorepo

```
CohortLens/
├── apps/
│   ├── web/                    # React + Vite dashboard
│   │   ├── src/
│   │   │   ├── components/     # UI components
│   │   │   ├── pages/          # Route pages
│   │   │   ├── hooks/          # Custom hooks
│   │   │   ├── stores/         # Zustand stores
│   │   │   ├── queries/        # TanStack Query hooks
│   │   │   └── lib/            # Utilities
│   │   ├── public/
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts  # v4: @theme in CSS
│   │   └── package.json
│   └── api/                    # Hono API server
│       ├── src/
│       │   ├── routes/         # API routes
│       │   ├── middleware/     # Auth, rate-limit, cors
│       │   ├── services/       # Business logic
│       │   └── index.ts        # Entry point
│       ├── drizzle.config.ts
│       └── package.json
├── packages/
│   ├── contracts/              # Solidity smart contracts
│   │   ├── src/
│   │   │   ├── LensToken.sol
│   │   │   ├── LensRegistry.sol
│   │   │   ├── LensOracle.sol
│   │   │   └── LensStaking.sol
│   │   ├── test/
│   │   ├── script/
│   │   ├── foundry.toml
│   │   └── package.json
│   ├── indexers/               # The Graph subgraphs
│   │   ├── subgraph.yaml
│   │   ├── schema.graphql
│   │   ├── src/
│   │   └── package.json
│   ├── db/                     # Shared database schema
│   │   ├── src/
│   │   │   ├── schema.ts       # Drizzle schema
│   │   │   ├── migrations/     # Migration files
│   │   │   └── index.ts
│   │   ├── drizzle.config.ts
│   │   └── package.json
│   └── shared/                 # Shared types and utilities
│       ├── src/
│       │   ├── types.ts        # Domain types
│       │   ├── constants.ts    # Chain IDs, addresses
│       │   └── index.ts
│       └── package.json
├── docker/
│   ├── compose.yaml            # Docker Compose (dev env)
│   ├── Dockerfile.api
│   └── Dockerfile.web
├── docs/
│   ├── adr/                    # Architecture Decision Records
│   └── agents/                 # Agent docs
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── AGENTS.md
├── CONTEXT.md
└── README.md
```

---

## 4. Fases de Implementación

### Fase 0: Dev Environment Setup (Issue #11)
**Status**: Ready | **Priority**: P0-Critical | **Package**: devops

**Entregable**: Monorepo funcional con Docker Compose

**Tareas**:
1. Inicializar pnpm workspace (`pnpm-workspace.yaml`)
2. Configurar Turborepo (`turbo.json`)
3. Crear `apps/web/` con Vite + React 19 + Tailwind 4
4. Crear `apps/api/` con Hono
5. Crear `packages/shared/` con tipos base
6. Crear `packages/db/` con Drizzle schema
7. Crear `docker/compose.yaml`:
   - PostgreSQL 18
   - Valkey 8
   - Graph Node (para desarrollo local)
   - IPFS
8. Configurar scripts de desarrollo (`pnpm dev`)
9. Configurar TypeScript paths y aliases
10. Verificar que todo compila y corre

**Validación**:
- `pnpm install` sin errores
- `pnpm dev` levanta todos los servicios
- `docker compose up` corre sin errores
- TypeScript compila sin errores

---

### Fase 1: Capital Flow Graph Core (Issue #8)
**Status**: Ready | **Priority**: P0-Critical | **Package**: backend, shared

**Entregable**: Schema de base de datos + tipos compartidos + seed data

**Tareas**:

#### 1.1 Database Schema (`packages/db`)
```typescript
// Node types (6)
export const wallets = pgTable('wallets', { ... });
export const protocols = pgTable('protocols', { ... });
export const chains = pgTable('chains', { ... });
export const assets = pgTable('assets', { ... });
export const pools = pgTable('pools', { ... });
export const positions = pgTable('positions', { ... });

// Edge types (6)
export const capitalFlows = pgTable('capital_flows', {
  id: text('id').primaryKey(),
  fromNodeId: text('from_node_id').notNull(),
  fromNodeType: text('from_node_type').notNull(),
  toNodeId: text('to_node_id').notNull(),
  toNodeType: text('to_node_type').notNull(),
  type: text('type').notNull(), // Deposit, Borrow, Repay, Withdraw, Swap, Transfer
  amount: numeric('amount').notNull(),
  assetId: text('asset_id').notNull(),
  chainId: text('chain_id').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  metadata: jsonb('metadata'),
});

// Materialized views for common queries
export const cohortMetrics = pgTable('cohort_metrics', { ... });
export const protocolMetrics = pgTable('protocol_metrics', { ... });
```

#### 1.2 Shared Types (`packages/shared`)
```typescript
// Domain types
export type NodeType = 'wallet' | 'protocol' | 'chain' | 'asset' | 'pool' | 'position';
export type FlowType = 'Deposit' | 'Borrow' | 'Repay' | 'Withdraw' | 'Swap' | 'Transfer';

export interface CapitalFlow {
  id: string;
  from: NodeRef;
  to: NodeRef;
  type: FlowType;
  amount: bigint;
  asset: string;
  chain: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface NodeRef {
  id: string;
  type: NodeType;
}
```

#### 1.3 Seed Data
- 3 chains: Ethereum, Polygon, Arbitrum
- 5 protocols: Aave V3, Uniswap V3, Compound V3, Curve, Balancer
- 10 assets: USDC, USDT, DAI, WETH, WBTC, etc.
- 50 sample capital flows

#### 1.4 API Routes (`apps/api`)
```
GET  /api/graph/nodes           - List all nodes
GET  /api/graph/flows           - List all capital flows
GET  /api/graph/flow/:id        - Get single flow
POST /api/graph/flows           - Create flow (indexer webhook)
GET  /api/graph/stats           - Graph statistics
GET  /api/graph/neighborhood/:id - Node neighborhood
```

**Validación**:
- Drizzle migrations corren sin errores
- Seed data inserta correctamente
- API endpoints responden con datos correctos
- Queries de grafo funcionan ( shortest path, neighborhood)

---

### Fase 2: Lenses System (Issue #9)
**Status**: Blocked (by #8) | **Priority**: P1-High | **Package**: backend

**Entregable**: Hono API para Lenses

**Tareas**:

#### 2.1 Lens Registry
```typescript
// Lens types
export type LensType = 'ml_model' | 'graph_query' | 'risk_signal';

export interface Lens {
  id: string;
  name: string;
  type: LensType;
  description: string;
  inputSchema: JSONSchema;
  outputSchema: JSONSchema;
  price: bigint; // LENS per query
  active: boolean;
}
```

#### 2.2 Lens Execution Engine
```typescript
// Example lenses
export const communityDetection: Lens = {
  id: 'community-detection',
  name: 'Community Detection',
  type: 'graph_query',
  execute: async (graph, params) => {
    // Louvain or Label Propagation algorithm
    return detectCommunities(graph, params);
  }
};

export const cheapestPath: Lens = {
  id: 'cheapest-path',
  name: 'Cheapest Path',
  type: 'graph_query',
  execute: async (graph, params) => {
    // Dijkstra with fee-weighted edges
    return findCheapestPath(graph, params.source, params.target);
  }
};
```

#### 2.3 API Routes
```
GET    /api/lenses              - List available lenses
GET    /api/lenses/:id          - Get lens details
POST   /api/lenses/:id/execute  - Execute a lens
GET    /api/lenses/:id/results  - Get execution results
POST   /api/lenses/:id/publish  - Publish lens to registry
```

#### 2.4 Oracle Integration
- LensOracle contract interaction for pricing
- LENS token balance checks
- Query fee collection

**Validación**:
- Lenses se registran correctamente
- Execución produce resultados válidos
- Pricing funciona con LENS tokens
- Resultados se cachean en Valkey

---

### Fase 3: Topological Analysis (Issue #10)
**Status**: Blocked (by #8) | **Priority**: P1-High | **Package**: backend

**Entregable**: Graph algorithms library

**Tareas**:

#### 3.1 Algorithm Library (`packages/shared`)
```typescript
// Algorithms
export async function detectCommunities(graph: CapitalFlowGraph): Promise<Cohort[]> {
  // Louvain algorithm for community detection
}

export async function findCheapestPath(
  graph: CapitalFlowGraph,
  source: string,
  target: string
): Promise<Route> {
  // Dijkstra with fee + slippage weights
}

export async function calculateCentrality(graph: CapitalFlowGraph): Promise<Map<string, number>> {
  // Betweenness centrality for protocol importance
}

export async function detectCoMovement(
  graph: CapitalFlowGraph,
  assets: string[]
): Promise<CoMovementResult> {
  // Correlation analysis for asset co-movement
}
```

#### 3.2 Performance Optimizations
- Materialized views for frequently queried subgraphs
- Graph partitioning for large datasets
- Parallel algorithm execution with worker threads

#### 3.3 API Routes
```
GET /api/analysis/communities     - Detect cohorts
GET /api/analysis/path            - Find cheapest path
GET /api/analysis/centrality      - Calculate centrality
GET /api/analysis/co-movement     - Detect co-movement
POST /api/analysis/custom         - Run custom graph query
```

**Validación**:
- Algoritmos producen resultados correctos
- Performance < 2s para grafos de 10K nodos
- Resultados son cacheados
- API endpoints documentados

---

### Fase 4: Smart Contracts
**Status**: Research | **Priority**: P1-High | **Package**: contracts

**Entregable**: 4 contratos desplegados en testnet

**Contratos**:

#### 4.1 LensToken (ERC20)
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract LensToken is ERC20, AccessControl {
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18;
    
    constructor() ERC20("LENS Token", "LENS") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _mint(msg.sender, MAX_SUPPLY);
    }
}
```

#### 4.2 LensRegistry
- Registrar Lenses con metadata
- Gestionar pricing dinámico
- Track usage statistics

#### 4.3 LensOracle
- Consultar precios de Lenses
- Calcular fees por query
- Integración con Chainlink para datos off-chain

#### 4.4 LensStaking
- Staking de LENS tokens
- 5% APY dinámico
- Rewards distribution

**Validación**:
- Todos los tests pasan (Forge)
- Coverage > 90%
- Deploy en Sepolia exitoso
- Audit básico completado

---

### Fase 5: Dashboard Frontend
**Status**: Research | **Priority**: P2-Medium | **Package**: frontend

**Entregable**: Dashboard funcional con visualización de grafos

**Componentes**:

#### 5.1 Graph Visualization
```tsx
import { ReactFlow, Node, Edge } from '@xyflow/react';

export function CapitalFlowGraph({ flows }: { flows: CapitalFlow[] }) {
  const nodes = useMemo(() => flowsToNodes(flows), [flows]);
  const edges = useMemo(() => flowsToEdges(flows), [flows]);
  
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodeClick={handleNodeClick}
      fitView
    />
  );
}
```

#### 5.2 Dashboard Pages
- `/` — Overview (stats, recent flows)
- `/graph` — Capital Flow Graph visualization
- `/lenses` — Lens marketplace
- `/cohorts` — Cohort analysis
- `/routes` — Route optimizer
- `/protocols` — Protocol details
- `/settings` — User settings

#### 5.3 Web3 Integration
```tsx
import { useAccount, useConnect } from 'wagmi';

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  
  return isConnected ? (
    <span>{address?.slice(0, 6)}...{address?.slice(-4)}</span>
  ) : (
    <button onClick={() => connect({ connector: connectors[0] })}>
      Connect Wallet
    </button>
  );
}
```

**Validación**:
- Dashboard carga en < 3s
- Graph visualización funciona con 1000+ nodos
- Wallet connection funciona
- Responsive en mobile

---

### Fase 6: Indexer
**Status**: Research | **Priority**: P1-High | **Package**: indexers

**Entregable**: The Graph subgraph sincronizando datos on-chain

**Tareas**:

#### 6.1 Subgraph Schema
```graphql
type CapitalFlow @entity {
  id: Bytes!
  from: Account!
  to: Account!
  type: String!
  amount: BigDecimal!
  asset: Token!
  chain: String!
  timestamp: BigInt!
  blockNumber: BigInt!
  txHash: Bytes!
}
```

#### 6.2 Mapping Handlers
```typescript
export function handleDeposit(event: DepositEvent): void {
  let flow = new CapitalFlow(event.transaction.hash);
  flow.from = event.params.sender;
  flow.to = event.params.pool;
  flow.type = "Deposit";
  flow.amount = event.params.amount;
  flow.asset = event.params.token;
  flow.timestamp = event.block.timestamp;
  flow.save();
}
```

#### 6.3 Hono Sync Service
- Escucha eventos del subgraph
- Sincroniza con PostgreSQL
- Actualiza materialized views
- Invalida cache en Valkey

**Validación**:
- Subgraph indexa datos de testnet
- Sync service sincroniza correctamente
- Datos son consistentes entre subgraph y PostgreSQL
- Latencia < 30s para datos nuevos

---

### Fase 7: Testing & CI/CD
**Status**: Research | **Priority**: P2-Medium | **Package**: devops

**Entregable**: Suite de tests completa + CI/CD pipeline

#### 7.1 Testing Strategy
```typescript
// Unit tests (Vitest)
describe('CapitalFlow', () => {
  it('should create a valid flow', () => { ... });
  it('should validate flow type', () => { ... });
});

// Integration tests
describe('Graph API', () => {
  it('should return neighborhood for node', () => { ... });
  it('should find shortest path', () => { ... });
});

// E2E tests (Playwright)
test('dashboard loads and displays graph', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-testid="graph"]')).toBeVisible();
});
```

#### 7.2 CI/CD Pipeline
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install
      - run: pnpm lint
  
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install
      - run: pnpm test
  
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install
      - run: pnpm build
```

**Validación**:
- Coverage > 80% para packages/core
- CI corre en < 5 minutos
- Deploy automático a Vercel en main
- Smoke tests pasan post-deploy

---

### Fase 8: Deployment
**Status**: Research | **Priority**: P3-Low | **Package**: devops

**Entregable**: Producción desplegada y funcionando

#### 8.1 Infrastructure
- **Frontend**: Vercel (auto-deploy from main)
- **Backend**: Docker container (AWS/GCP/Railway)
- **Database**: Managed PostgreSQL (Neon, Supabase, or AWS RDS)
- **Cache**: Managed Valkey/Redis (Upstash, Redis Cloud)
- **Indexer**: The Graph hosted service

#### 8.2 Monitoring
- **Logs**: Axiom or Datadog
- **Metrics**: Prometheus + Grafana
- **Errors**: Sentry
- **Uptime**: BetterStack

#### 8.3 Security
- Rate limiting on API endpoints
- Input validation with Zod
- SQL injection prevention (Drizzle parameterized queries)
- CORS configuration
- Environment variable management

**Validación**:
- Load test: 1000 concurrent users
- Uptime > 99.9%
- P95 latency < 500ms
- No critical security vulnerabilities

---

## 5. Dependencias y Orden de Ejecución

```
Fase 0 (Dev Environment)
    ↓
Fase 1 (Capital Flow Graph Core)
    ↓
Fase 2 (Lenses System) ←──┐
Fase 3 (Topological Analysis) ←──┤ (en paralelo)
Fase 4 (Smart Contracts) ←──────┘
    ↓
Fase 5 (Dashboard Frontend)
    ↓
Fase 6 (Indexer)
    ↓
Fase 7 (Testing & CI/CD)
    ↓
Fase 8 (Deployment)
```

---

## 6. Riesgos y Mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| The Graph cambia API | Alto | Abstraer indexer detrás de interfaz |
| OpenZeppelin breaking changes | Medio | Lock version, actualizaciones controladas |
| Performance de grafo grande | Alto | Materialized views, particionamiento, caching |
| Costos de RPC en mainnet | Medio | Caching agresivo, rate limiting, subgraph |
| Wallet connection issues | Medio | Múltiples wallets soportadas, fallback |
| Tailwind v4 migration | Bajo | Seguir guía oficial, testing visual |

---

## 7. Métricas de Éxito

| Métrica | Target | Fase |
|---------|--------|------|
| Tiempo de build | < 30s | 0 |
| Test coverage | > 80% | 7 |
| API latency (P95) | < 500ms | 8 |
| Graph query time | < 2s (10K nodes) | 3 |
| Dashboard load time | < 3s | 5 |
| Uptime | > 99.9% | 8 |
| Wallet connection success | > 95% | 5 |

---

## 8. Próximos Pasos Inmediatos

1. **Ejecutar Fase 0**: Setup del monorepo
2. **Crear issues adicionales**: Para tareas específicas de cada fase
3. **Configurar CI/CD**: GitHub Actions para lint y test
4. **Deploy inicial**: Frontend en Vercel, Backend en Railway/Docker
5. **Primer PR**: Estructura base del monorepo

---

**Board**: https://github.com/users/quantumquirkxyz/projects/17
**Repo**: https://github.com/quantumquirkxyz/CohortLens
