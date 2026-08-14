# ADR 004: Database Schema for Capital Flow Graph

## Status

Accepted (updated 2026-08-14: ORM changed from **Prisma** to **Drizzle ORM**
when implementing issue #8, per `docs/IMPLEMENTATION-PLAN.md` §2.1 — SQL-first,
no binary engine, better fit for the complex graph queries; Prisma 8 RC had
breaking changes).

## Context

The Capital Flow Graph is a directed, temporal, weighted property graph
representing value movement in DeFi. It needs to be stored in PostgreSQL with
the Drizzle ORM.

**Node types**: Wallet, Protocol, Chain, Asset, Pool, Position
**Edge types**: Deposit, Borrow, Repay, Withdraw, Swap, Transfer
**Edge properties**: amount, timestamp, weight

## Decision

Use **adjacency list schema** with typed node and edge tables (Drizzle).

### Schema Design

```typescript
// packages/database/src/schema.ts (abridged — see the file for the full schema)
import { pgEnum, pgTable, text, numeric, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const nodeTypeEnum = pgEnum('node_type', [
  'wallet', 'protocol', 'chain', 'asset', 'pool', 'position',
]);
export const flowTypeEnum = pgEnum('flow_type', [
  'Deposit', 'Borrow', 'Repay', 'Withdraw', 'Swap', 'Transfer',
]);

export const chains = pgTable('chains', {
  id: text('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  rpcUrl: text('rpc_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ... protocols, wallets, assets, pools, positions (node tables)

export const capitalFlows = pgTable('capital_flows', {
  id: text('id').primaryKey().defaultRandom(),
  fromNodeId: text('from_node_id').notNull(),
  fromNodeType: nodeTypeEnum('from_node_type').notNull(),
  toNodeId: text('to_node_id').notNull(),
  toNodeType: nodeTypeEnum('to_node_type').notNull(),
  type: flowTypeEnum('type').notNull(),
  amount: numeric('amount', { precision: 36, scale: 18 }).notNull(),
  assetId: text('asset_id').notNull(),
  chainId: text('chain_id').notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
  metadata: jsonb('metadata'),
});
```

### Indexes for Graph Queries

```sql
CREATE INDEX idx_capital_flow_from ON capital_flows (from_node_id);
CREATE INDEX idx_capital_flow_to ON capital_flows (to_node_id);
CREATE INDEX idx_capital_flow_type ON capital_flows (type);
CREATE INDEX idx_capital_flow_timestamp ON capital_flows (timestamp);

-- Composite index for path queries
CREATE INDEX idx_capital_flow_path ON capital_flows (from_node_id, to_node_id, timestamp);

-- Materialized view for second-degree connections (deferred to Fase 3)
-- CREATE MATERIALIZED VIEW wallet_2nd_degree AS ...
```

## Alternatives Considered

### Single JSONB Graph Table

```typescript
const graph = pgTable('graph', {
  id: text('id').primaryKey(),
  nodes: jsonb('nodes'),
  edges: jsonb('edges'),
});
```

- **Pros**: Flexible, easy to add new node/edge types
- **Cons**: No referential integrity, harder to query, no indexes on properties

### Apache AGE (PostgreSQL Graph Extension)

- **Pros**: Native graph queries (Cypher), LPG support
- **Cons**: Extra dependency, less mature, Drizzle integration issues

### Separate Node/Edge Tables per Type

- **Pros**: Strong typing, better indexes
- **Cons**: Many tables, complex joins, harder to extend

### Adjacency List (Chosen)

- **Pros**: Standard pattern, good performance with indexes, Drizzle-friendly
- **Cons**: More complex queries for multi-hop traversal

### Prisma vs Drizzle

Prisma was originally selected (this ADR's first version). It was replaced by
Drizzle when implementing issue #8 because: Drizzle is SQL-first (closer to
native SQL, better for the complex graph JOINs), has no binary engine
(lighter, serverless/edge-friendly), derives types from the schema without
codegen, and avoids Prisma 8's breaking changes (RC at the time).

## Consequences

### Positive

- Strong referential integrity via foreign keys on the node tables
- Drizzle derives TypeScript types straight from the schema (no codegen)
- Indexes enable fast traversal queries
- Materialized views for expensive graph computations (Fase 3)

### Negative

- Multi-hop queries require recursive CTEs
- Need to maintain materialized views
- Schema changes require migrations (`drizzle-kit generate` / `migrate`)

## References

- [Drizzle ORM](https://orm.drizzle.team)
- [Graph Queries in PostgreSQL](https://viprasol.com/blog/postgres-graph-queries/)
- [docs/IMPLEMENTATION-PLAN.md §2.1](IMPLEMENTATION-PLAN.md)
