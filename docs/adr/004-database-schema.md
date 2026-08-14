# ADR 004: Database Schema for Capital Flow Graph

## Status

Accepted

## Context

The Capital Flow Graph is a directed, temporal, weighted property graph representing value movement in DeFi. It needs to be stored in PostgreSQL with Prisma ORM.

**Node types**: Wallet, Protocol, Chain, Asset, Pool, Position
**Edge types**: Deposit, Borrow, Repay, Withdraw, Swap, Transfer
**Edge properties**: amount, timestamp, weight

## Decision

Use **adjacency list schema** with typed node and edge tables.

### Schema Design

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// === NODES ===

model Chain {
  id        String   @id @default(uuid())
  name      String   @unique
  rpcUrl    String?
  createdAt DateTime @default(now())

  protocols Protocol[]
  assets    Asset[]
}

model Protocol {
  id        String   @id @default(uuid())
  name      String
  chainId   String
  chain     Chain    @relation(fields: [chainId], references: [id])
  createdAt DateTime @default(now())

  pools Pool[]
}

model Wallet {
  id        String   @id @default(uuid())
  address   String   @unique
  label     String?
  createdAt DateTime @default(now())

  positions Position[]
}

model Asset {
  id        String   @id @default(uuid())
  symbol    String
  name      String
  chainId   String
  chain     Chain    @relation(fields: [chainId], references: [id])
  decimals  Int      @default(18)
  createdAt DateTime @default(now())

  pools Pool[]
}

model Pool {
  id         String   @id @default(uuid())
  protocolId String
  protocol   Protocol @relation(fields: [protocolId], references: [id])
  assetId    String
  asset      Asset    @relation(fields: [assetId], references: [id])
  address    String?
  createdAt  DateTime @default(now())

  positions Position[]
}

model Position {
  id        String   @id @default(uuid())
  walletId  String
  wallet    Wallet   @relation(fields: [walletId], references: [id])
  poolId    String
  pool      Pool     @relation(fields: [poolId], references: [id])
  amount    Decimal  @db.Decimal(36, 18)
  type      String   // "deposit" | "borrow"
  createdAt DateTime @default(now())

  @@unique([walletId, poolId, type])
}

// === EDGES (Capital Flows) ===

model CapitalFlow {
  id        String   @id @default(uuid())
  type      FlowType
  fromWallet String
  toWallet   String
  poolId    String?
  amount    Decimal  @db.Decimal(36, 18)
  weight    Float    @default(1.0)
  timestamp DateTime
  createdAt DateTime @default(now())

  pool Pool? @relation(fields: [poolId], references: [id])

  @@index([fromWallet])
  @@index([toWallet])
  @@index([timestamp])
  @@index([type])
  @@index([fromWallet, toWallet, timestamp])
}

enum FlowType {
  Deposit
  Borrow
  Repay
  Withdraw
  Swap
  Transfer
}
```

### Indexes for Graph Queries

```sql
-- Traversal performance
CREATE INDEX idx_capital_flow_from ON "CapitalFlow"("fromWallet");
CREATE INDEX idx_capital_flow_to ON "CapitalFlow"("toWallet");
CREATE INDEX idx_capital_flow_type ON "CapitalFlow"(type);
CREATE INDEX idx_capital_flow_timestamp ON "CapitalFlow"(timestamp);

-- Composite index for path queries
CREATE INDEX idx_capital_flow_path ON "CapitalFlow"("fromWallet", "toWallet", timestamp);

-- Materialized view for second-degree connections
CREATE MATERIALIZED VIEW wallet_2nd_degree AS
SELECT DISTINCT f1."fromWallet" AS wallet_id, f2."toWallet" AS connected_to
FROM "CapitalFlow" f1
JOIN "CapitalFlow" f2 ON f1."toWallet" = f2."fromWallet"
WHERE f1."fromWallet" <> f2."toWallet";

CREATE INDEX idx_2nd_degree ON wallet_2nd_degree(wallet_id);
```

## Alternatives Considered

### Single JSONB Graph Table
```prisma
model Graph {
  id     String @id @default(uuid())
  nodes  Json
  edges  Json
}
```
- **Pros**: Flexible, easy to add new node/edge types
- **Cons**: No referential integrity, harder to query, no indexes on properties

### Apache AGE (PostgreSQL Graph Extension)
- **Pros**: Native graph queries (Cypher), LPG support
- **Cons**: Extra dependency, less mature, Prisma integration issues

### Separate Node/Edge Tables per Type
- **Pros**: Strong typing, better indexes
- **Cons**: Many tables, complex joins, harder to extend

### Adjacency List (Chosen)
- **Pros**: Standard pattern, good performance with indexes, Prisma-friendly
- **Cons**: More complex queries for multi-hop traversal

## Consequences

### Positive
- Strong referential integrity via foreign keys
- Prisma ORM works seamlessly
- Indexes enable fast traversal queries
- Materialized views for expensive graph computations

### Negative
- Multi-hop queries require recursive CTEs
- Need to maintain materialized views
- Schema changes require migrations

## References

- [Prisma Relations](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations)
- [Graph Queries in PostgreSQL](https://viprasol.com/blog/postgres-graph-queries/)
- [Translate Graph DB to Prisma](https://spin.atomicobject.com/migrate-graph-database/)
